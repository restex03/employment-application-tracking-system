using Eats.Ingestion.Application.JobPosts.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Eats.Ingestion.Application.Routes;
public static class JobPostApi
{
    public static RouteGroupBuilder MapJobPostApi(this RouteGroupBuilder group)
    {
        group.MapGet("/{id}", GetById);
        group.MapGet("/", List)
            .WithDescription("Returns { data, totalCount }, with the matching count before pagination. sortBy: companyName, requisitionId, title, postedDate. sortDirection: asc or desc. Default: postedDate desc. Unknown values last, ID tie-breaker.");

        return group;
    }

    public static async Task<Ok<JobPostListResponse>> List(
        [AsParameters] JobPostQuery queryParams, IJobPostService jobPostService,
        ILoggerFactory loggerFactory, CancellationToken ct)
    {
        if (queryParams.PageCount < 1 || queryParams.PageNumber < 1)
        {
            loggerFactory.CreateLogger(nameof(JobPostApi)).LogWarning("Invalid job post pagination parameters.");
            throw new ArgumentException("PageCount and PageNumber must be greater than zero.", nameof(queryParams));
        }
        var result = await jobPostService.ListAsync(queryParams, ct);
        var totalCount = await jobPostService.CountAsync(queryParams, ct);
        return TypedResults.Ok(new JobPostListResponse(result, totalCount));

    }
    public static async Task<Ok<JobPostDto>> GetById(Guid id, IJobPostService jobPostService, CancellationToken ct)
    {
        var result = await jobPostService.GetByIdOrThrowAsync(id, ct);
        return TypedResults.Ok(result);
    }
}