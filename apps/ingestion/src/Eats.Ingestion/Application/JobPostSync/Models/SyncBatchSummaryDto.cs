namespace Eats.Ingestion.Application.JobPostSync;

public sealed record SyncBatchSummaryDto(
    Guid SyncBatchId,
    int TotalCount,
    int QueuedCount,
    int InProgressCount,
    int CompletedCount,
    int FailedCount);
