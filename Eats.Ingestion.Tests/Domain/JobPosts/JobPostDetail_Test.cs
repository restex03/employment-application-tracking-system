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
        var discovery = CreateDiscovery();

        jobPost.HydrateDetail(discovery);

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(jobPost));
        var serializedDetail = json.RootElement.GetProperty(nameof(JobPost.Detail));
        Assert.NotNull(jobPost.Detail);
        Assert.Equal(jobPost.Id, serializedDetail.GetProperty(nameof(JobPostDetail.JobPostId)).GetGuid());
        Assert.False(serializedDetail.TryGetProperty("JobPost", out _));
    }

    [Fact]
    public void TrackingJobPost_PreservesRequiredDetailForeignKeyWithoutInverseNavigation()
    {
        var options = new DbContextOptionsBuilder<EatsIngestionDbContext>()
            .UseNpgsql("Host=localhost;Database=unused")
            .Options;
        using var context = new EatsIngestionDbContext(options);
        var jobPost = CreateJobPost();
        jobPost.HydrateDetail(CreateDiscovery());
        var detail = jobPost.Detail!;
        Assert.Equal(jobPost.Id, detail.JobPostId);

        context.Add(jobPost);

        Assert.Equal(jobPost.Id, detail.JobPostId);
        var relationship = Assert.Single(context.Model.FindEntityType(typeof(JobPostDetail))!.GetForeignKeys());
        Assert.Equal(nameof(JobPostDetail.JobPostId), Assert.Single(relationship.Properties).Name);
        Assert.False(relationship.Properties[0].IsShadowProperty());
        Assert.Equal(typeof(Guid), relationship.Properties[0].ClrType);
        Assert.False(relationship.Properties[0].IsNullable);
        Assert.Equal(typeof(JobPost), relationship.PrincipalEntityType.ClrType);
        Assert.Equal(nameof(JobPost.Detail), relationship.PrincipalToDependent!.Name);
        Assert.Null(relationship.DependentToPrincipal);
        Assert.True(relationship.IsUnique);
        Assert.True(relationship.IsRequired);
        Assert.Equal(DeleteBehavior.Cascade, relationship.DeleteBehavior);
    }

    [Fact]
    public void HydrateDetail_CreatesDetailWithGeneratedIdentityAndAllDiscoveredFields()
    {
        var jobPost = CreateJobPost();
        var discovery = CreateDiscovery();

        jobPost.HydrateDetail(discovery);

        var detail = Assert.IsType<JobPostDetail>(jobPost.Detail);
        Assert.NotEqual(Guid.Empty, detail.Id);
        Assert.Equal(jobPost.Id, detail.JobPostId);
        Assert.Equal(discovery.Description, detail.Description);
        Assert.Equal(discovery.EmploymentType, detail.EmploymentType);
        Assert.Equal(discovery.Locations, detail.Locations);
        Assert.Equal(discovery.ValidThrough, detail.ValidThrough);
        Assert.Equal(discovery.RemoteType, detail.RemoteType);
        Assert.Equal(discovery.ApplicantLocations, detail.ApplicantLocations);
        Assert.Equal(discovery.FetchedAt, detail.FetchedAt);
        Assert.Equal(discovery.RequisitionId, jobPost.RequisitionId);
        Assert.Equal(discovery.RemoteType, jobPost.RemoteType);
    }

    [Fact]
    public void HydrateDetail_PreservesExistingValuesWhenDiscoveryOmitsThem()
    {
        var jobPost = CreateJobPost();
        var discovery = CreateDiscovery();
        jobPost.HydrateDetail(discovery);
        var originalDetail = jobPost.Detail!;

        jobPost.HydrateDetail(discovery with { RequisitionId = null, RemoteType = null });

        Assert.Equal(discovery.RequisitionId, jobPost.RequisitionId);
        Assert.Equal(discovery.RemoteType, jobPost.RemoteType);
        Assert.NotSame(originalDetail, jobPost.Detail);
        Assert.NotEqual(originalDetail.Id, jobPost.Detail!.Id);
        Assert.Equal(jobPost.Id, jobPost.Detail.JobPostId);
    }

    [Fact]
    public void Constructor_HydratesDetailFromDiscovery()
    {
        var id = Guid.NewGuid();
        var discovery = CreateDiscovery();

        var jobPost = new JobPost(
            id,
            Guid.NewGuid(),
            "Software Engineer",
            "/jobs/123",
            DateTime.UtcNow,
            new Uri("https://acme.example.com/jobs/123"),
            detail: discovery);

        Assert.NotNull(jobPost.Detail);
        Assert.Equal(id, jobPost.Detail.JobPostId);
        Assert.NotEqual(Guid.Empty, jobPost.Detail.Id);
        Assert.Equal(discovery.Description, jobPost.Detail.Description);
        Assert.Equal(discovery.RequisitionId, jobPost.RequisitionId);
        Assert.Equal(discovery.RemoteType, jobPost.RemoteType);
    }

    [Fact]
    public void HydrateDetail_RejectsNullDiscoveryWithoutReplacingDetail()
    {
        var jobPost = CreateJobPost();
        jobPost.HydrateDetail(CreateDiscovery());
        var originalDetail = jobPost.Detail;

        Assert.Throws<ArgumentNullException>(() => jobPost.HydrateDetail(null!));

        Assert.Same(originalDetail, jobPost.Detail);
    }

    private static JobPostDetailDiscovery CreateDiscovery()
    {
        return new JobPostDetailDiscovery(
            "Job description",
            "REQ-123",
            "Software Engineer",
            "Hybrid",
            EmploymentType: "Full time",
            Locations: [new JobPostLocation { City = "Atlanta", Country = "US" }],
            ValidThrough: "2026-12-31",
            ApplicantLocations: ["US"],
            FetchedAt: new DateTime(2026, 10, 24, 14, 0, 0, DateTimeKind.Utc));
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
