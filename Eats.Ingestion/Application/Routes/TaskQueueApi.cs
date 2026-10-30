using Eats.Ingestion.Application.JobPostSync;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Eats.Ingestion.Application.Routes;
public static class TaskQueueApi
{
    public static RouteGroupBuilder MapTaskQueueApi(this RouteGroupBuilder group)
    {
        group.MapGet("/{id}", GetById);
        group.MapGet("/", List);
        group.MapPost("/", Add);

        return group;
    }

    public static async Task<Ok<IReadOnlyList<JobPostSyncQueueTask>>> Add(JobPostSyncRequest req, ITaskQueueService service, CancellationToken ct)
    {
        var jobIds = await service.AddAsync(new JobPostSyncTask
        {
            SourceIds = req.SourceIds ?? [],
            SearchText = req.SearchText ?? ""
        }, ct);

        return TypedResults.Ok(jobIds);
    }

    public static async Task<Ok<IReadOnlyList<QueueTaskDto>>> List(ITaskQueueService svc, bool active = false)
    {
        var result = active ? await svc.GetAllActiveAsync() : await svc.GetAllAsync();
        return TypedResults.Ok(result);
    }

    public static async Task<Ok<QueueTaskDto>> GetById(ITaskQueueService svc, Guid id)
    {
        var result = await svc.GetByIdOrThrowAsync(id);
        return TypedResults.Ok(result);
    }

    public interface ITaskQueueRequest
    {
        public string Type { get; }
    }
    public class JobPostSyncRequest : ITaskQueueRequest
    {
        public required string Type { get; init; }
        public required Guid[]? SourceIds { get; init; } = [];

        public string? SearchText { get; init; } = "";
    }
}