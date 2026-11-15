
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Microsoft.AspNetCore.Http.HttpResults;


namespace Eats.Ingestion.Application.Routes;
public static class DiscoveryApi
{
    public static RouteGroupBuilder MapDiscoveryApi(this RouteGroupBuilder group)
    {
        group.MapPost("/jobPosts", DiscoverJobPosts);
        group.MapPost("/jobPostDetails", DiscoverJobPostDetails);

        return group;
    }

    public static async Task<Ok<IReadOnlyList<JobPostDiscovery.JobPostDiscovery>>> DiscoverJobPosts(
        JobPostDiscoveryRequest req, 
        IJobPostDiscoveryServiceFactory svcFactory, 
        IJobSourceRepository jobSourceRepo, 
        CancellationToken ct) 
    {
        if (req.JobSourceId == Guid.Empty) {
            throw new ArgumentException("JobSourceId is required", nameof(req.JobSourceId));
        }
        
        var jobSource = await jobSourceRepo.GetByIdOrThrowAsync(req.JobSourceId, ct);
        var svc = svcFactory.Create(jobSource);
        var result = await svc.FetchList(req.SearchText, ct);
        return TypedResults.Ok(result);

    }

    public static async Task<Ok<JobPostDetailDiscovery>> DiscoverJobPostDetails(
        JobPostDetailDiscoveryRequest req,
        IJobPostDiscoveryServiceFactory svcFactory,
        IJobSourceRepository jobSourceRepo,
        CancellationToken ct)
    {
        var jobSource = await jobSourceRepo.GetByIdOrThrowAsync(req.JobSourceId, ct);
        var svc = svcFactory.Create(jobSource);
        var result = await svc.FetchDetail(req.DetailPath, ct);
        return TypedResults.Ok(result);
    }
    public class JobPostDiscoveryRequest
    {
        public required Guid JobSourceId { get; init; }
        public string? SearchText { get; init; } = "";
    }

    public class JobPostDetailDiscoveryRequest
    {
        public required string DetailPath { get; init; }
        public required Guid JobSourceId { get; init; }
    }
}


