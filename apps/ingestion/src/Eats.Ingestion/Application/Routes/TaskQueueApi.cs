using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Application.TaskQueue.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Eats.Ingestion.Application.Routes;
public static class TaskQueueApi
{
    public static RouteGroupBuilder MapTaskQueueApi(this RouteGroupBuilder group)
    {
        group.MapGet("/{id:guid}", GetById);
        group.MapGet("/batches/{syncBatchId:guid}/tasks", GetBatchTasks);
        group.MapGet("/batches/{syncBatchId:guid}/summary", GetBatchSummary);
        group.MapGet("/", List);
        group.MapPost("/", Add);

        return group;
    }

    public static async Task<Ok<JobPostSyncEnqueueResponse>> Add(JobPostSyncRequest req, ITaskQueueService service, CancellationToken ct)
    {
        var batch = await service.AddAsync(new JobPostSyncTask
        {
            SourceIds = req.SourceIds ?? [],
            SearchText = req.SearchText ?? ""
        }, ct);

        return TypedResults.Ok(batch);
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

    public static async Task<Ok<IReadOnlyList<QueueTaskDto>>> GetBatchTasks(
        ITaskQueueService service, Guid syncBatchId, CancellationToken ct)
    {
        var tasks = await service.GetByBatchIdAsync(syncBatchId, ct);
        return TypedResults.Ok(tasks);
    }

    public static async Task<Results<Ok<SyncBatchSummaryDto>, NotFound>> GetBatchSummary(
        ITaskQueueService service, Guid syncBatchId, CancellationToken ct)
    {
        var summary = await service.GetBatchSummaryAsync(syncBatchId, ct);
        return summary is null ? TypedResults.NotFound() : TypedResults.Ok(summary);
    }

    public interface ITaskQueueRequest
    {
        public QueueTaskType Type { get; }
    }
    public class JobPostSyncRequest : ITaskQueueRequest
    {
        public required QueueTaskType Type { get; init; }
        public required Guid[]? SourceIds { get; init; } = [];

        public string? SearchText { get; init; } = "";
    }
}