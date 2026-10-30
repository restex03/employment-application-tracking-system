using Eats.Ingestion.Application.JobPosts.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Eats.Ingestion.Application.Routes;
public static class JobPostApi
{
    public static RouteGroupBuilder MapJobPostApi(this RouteGroupBuilder group)
    {
        group.MapGet("/{id}", GetById);
        group.MapGet("/", List);

        return group;
    }

    public static async Task<Ok<IReadOnlyList<JobPostDto>>> List(JobPostQuery queryParams, IJobPostService jobPostService, CancellationToken ct)
    {
        var result = await jobPostService.ListAsync(queryParams, ct);
        return TypedResults.Ok(result);

    }
    public static async Task<Ok<JobPostDto>> GetById(Guid id, IJobPostService jobPostService, CancellationToken ct)
    {
        var result = await jobPostService.GetByIdOrThrowAsync(id, ct);
        return TypedResults.Ok(result);
    }
}