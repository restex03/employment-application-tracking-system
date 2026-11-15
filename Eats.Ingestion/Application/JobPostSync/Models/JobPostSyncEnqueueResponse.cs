namespace Eats.Ingestion.Application.JobPostSync;

public sealed record JobPostSyncEnqueueResponse(
    Guid SyncBatchId,
    IReadOnlyList<JobPostSyncQueueTask> QueueTasks);
