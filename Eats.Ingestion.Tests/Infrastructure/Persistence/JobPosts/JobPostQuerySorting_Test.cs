using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;

namespace Eats.Ingestion.Tests.Infrastructure.Persistence.JobPosts;

public sealed class JobPostQuerySorting_Test
{
    [Theory]
    [InlineData("companyName")]
    [InlineData("requisitionId")]
    [InlineData("title")]
    [InlineData("location")]
    [InlineData("postedDate")]
    public void Sorts_All_Matches_Before_Paging_With_Unknowns_Last(string sortBy)
    {
        var sourceA = new JobSource(Guid.NewGuid(), "alpha", "https://example.com", "https://example.com");
        var sourceZ = new JobSource(Guid.NewGuid(), "Zulu", "https://example.com", "https://example.com");
        var earlier = new DateTime(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);
        var a = Post(sourceA.Id, "alpha", earlier);
        var z = Post(sourceZ.Id, "Zulu", earlier.AddDays(1));
        var unknown = Post(Guid.NewGuid(), "", null);
        var posts = new[] { unknown, z, a }.AsQueryable();
        var sources = new[] { sourceA, sourceZ }.AsQueryable();

        foreach (var direction in new[] { "asc", "desc" })
        {
            var sorted = JobPostQuerySorting.Apply(posts, sources, Query(sortBy, direction))
                .ThenBy(post => post.Id);
            Assert.Equal(direction == "asc" ? a.Id : z.Id, sorted.Take(1).Single().Id);
            Assert.Equal(unknown.Id, sorted.Skip(2).Take(1).Single().Id);
        }
    }

    [Fact]
    public void Defaults_To_PostedDate_Descending_With_Id_TieBreaker()
    {
        var date = DateTime.UtcNow;
        var first = Post(Guid.NewGuid(), "A", date);
        var second = Post(Guid.NewGuid(), "A", date);
        var old = Post(Guid.NewGuid(), "A", date.AddDays(-1));
        var sorted = JobPostQuerySorting.Apply(new[] { old, second, first }.AsQueryable(),
                Array.Empty<JobSource>().AsQueryable(), Query(null, null))
            .ThenBy(post => post.Id).ToArray();

        Assert.Equal(new[] { first.Id, second.Id }.Order(), sorted.Take(2).Select(post => post.Id));
        Assert.Equal(old.Id, sorted.Last().Id);
    }

    [Theory]
    [InlineData("companyName")]
    [InlineData("requisitionId")]
    [InlineData("title")]
    [InlineData("location")]
    [InlineData("postedDate")]
    public void Sorting_Translates_To_Postgres_Before_Limit(string sortBy)
    {
        var options = new DbContextOptionsBuilder<EatsIngestionDbContext>()
            .UseNpgsql("Host=localhost;Database=translation_only").Options;
        using var context = new EatsIngestionDbContext(options);
        foreach (var direction in new[] { "asc", "desc" })
        {
            var sql = JobPostQuerySorting.Apply(context.JobPosts, context.JobSources, Query(sortBy, direction))
                .ThenBy(post => post.Id).Skip(10).Take(5).ToQueryString();
            Assert.Contains("ORDER BY", sql);
            Assert.Contains("LIMIT", sql);
            Assert.True(sql.IndexOf("ORDER BY", StringComparison.Ordinal) < sql.IndexOf("LIMIT", StringComparison.Ordinal));
            if (direction == "desc")
            {
                Assert.Contains("DESC", sql);
            }
        }
    }

    private static JobPost Post(Guid sourceId, string text, DateTime? date) =>
        new(Guid.NewGuid(), sourceId, text, "/job", DateTime.UtcNow,
            new Uri("https://example.com/job"), requisitionId: text, location: text, postedDate: date);

    private static JobPostQuery Query(string? sortBy, string? direction) => new()
    {
        PageCount = 1, PageNumber = 1, CompanyName = null, RequisitionId = null, Title = null,
        Location = null, PostedDate = null, JobMatchScore = null, ApplicationStatus = null,
        SortBy = sortBy is null ? null : ParseSortBy(sortBy),
        SortDirection = direction is null ? null : ParseDirection(direction)
    };

    private static JobPostSortBy ParseSortBy(string value)
    {
        Assert.True(JobPostSortBy.TryParse(value, out var sortBy));
        return sortBy;
    }

    private static SortDirection ParseDirection(string value)
    {
        Assert.True(SortDirection.TryParse(value, out var direction));
        return direction;
    }
}
