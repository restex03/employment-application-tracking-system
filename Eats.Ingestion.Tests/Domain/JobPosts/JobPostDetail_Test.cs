using System.Text.Json;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;

namespace Eats.Ingestion.Tests.Domain.JobPosts;

public sealed class JobPostDetailTests
{
    [Fact]
    public void HydrateDetail_AllowsSerializingJobPostWithoutReferenceCycles()
    {
        var jobPost = CreateJobPost();
        var detail = new JobPostDetail(Guid.NewGuid(), "Job description", jobPost.Id);

        jobPost.HydrateDetail(detail);

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(jobPost));
        var serializedDetail = json.RootElement.GetProperty(nameof(JobPost.Detail));
        Assert.Same(detail, jobPost.Detail);
        Assert.Equal(jobPost.Id, serializedDetail.GetProperty(nameof(JobPostDetail.JobPostId)).GetGuid());
        Assert.False(serializedDetail.TryGetProperty("JobPost", out _));
    }

    [Fact]
    public void TrackingJobPost_SetsDetailForeignKeyWithoutInverseNavigation()
    {
        var options = new DbContextOptionsBuilder<EatsIngestionDbContext>()
            .UseNpgsql("Host=localhost;Database=unused")
            .Options;
        using var context = new EatsIngestionDbContext(options);
        var jobPost = CreateJobPost();
        var detail = new JobPostDetail(Guid.NewGuid(), "Job description");
        jobPost.HydrateDetail(detail);

        context.Add(jobPost);

        Assert.Equal(jobPost.Id, detail.JobPostId);
        var relationship = Assert.Single(context.Model.FindEntityType(typeof(JobPostDetail))!.GetForeignKeys());
        Assert.Equal(nameof(JobPostDetail.JobPostId), Assert.Single(relationship.Properties).Name);
        Assert.Equal(typeof(JobPost), relationship.PrincipalEntityType.ClrType);
        Assert.Equal(nameof(JobPost.Detail), relationship.PrincipalToDependent!.Name);
        Assert.Null(relationship.DependentToPrincipal);
        Assert.True(relationship.IsUnique);
        Assert.True(relationship.IsRequired);
        Assert.Equal(DeleteBehavior.Cascade, relationship.DeleteBehavior);
    }

    private static JobPost CreateJobPost()
    {
        return new JobPost(
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Software Engineer",
            "/jobs/123",
            DateTime.UtcNow,
            new Uri("https://acme.example.com/jobs/123"));
    }
}
