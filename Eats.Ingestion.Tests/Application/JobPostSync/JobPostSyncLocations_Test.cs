using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

namespace Eats.Ingestion.Tests.Application.JobPostSync;

public sealed class JobPostSyncLocations_Test
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t")]
    [InlineData("Atlanta, GA")]
    public async Task Maps_Discovery_Location_To_NonNull_Array_Without_Splitting_Commas(string? location)
    {
        var source = new JobSource(Guid.NewGuid(), "Acme", "https://example.com", "https://example.com");
        var sources = new Mock<IJobSourceRepository>();
        sources.Setup(s => s.GetByIdOrThrowAsync(source.Id, It.IsAny<CancellationToken>())).ReturnsAsync(source);
        var discovery = new Mock<IJobPostDiscoveryService>();
        discovery.Setup(s => s.FetchList(null, It.IsAny<CancellationToken>())).ReturnsAsync(
            new[] { new JobPostDiscoveryDto(source.Id, "Engineer", "/job", new Uri("https://example.com/job"),
                null, location, null, null) });
        var factory = new Mock<IJobPostDiscoveryServiceFactory>();
        factory.Setup(f => f.Create(source)).Returns(discovery.Object);
        var screener = new Mock<IJobPostScreener>();
        screener.Setup(s => s.ScreenJobPost(It.IsAny<IJobScreenCriteria>())).Returns(true);
        JobPost[]? saved = null;
        var posts = new Mock<IJobPostRepository>();
        posts.Setup(p => p.UpsertManyAsync(It.IsAny<IEnumerable<JobPost>>(), It.IsAny<CancellationToken>()))
            .Callback<IEnumerable<JobPost>, CancellationToken>((values, _) => saved = values.ToArray())
            .Returns(Task.CompletedTask);
        var service = new IJobPostSyncService.Imp(sources.Object, posts.Object, factory.Object,
            screener.Object, NullLogger<IJobPostSyncService.Imp>.Instance);

        await service.SyncJobPostsOrThrowAsync(source.Id);

        Assert.NotNull(saved);
        var post = Assert.Single(saved);
        Assert.Equal(string.IsNullOrWhiteSpace(location) ? Array.Empty<string>() : [location], post.Locations);
    }

    [Fact]
    public void JobPost_Defaults_Locations_To_Empty_Array()
    {
        var post = new JobPost(Guid.NewGuid(), Guid.NewGuid(), "Engineer", "/job", DateTime.UtcNow,
            new Uri("https://example.com/job"));
        Assert.Empty(post.Locations);
    }
}
