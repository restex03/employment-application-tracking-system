namespace Eats.Ingestion.Application.JobPostSync.Queue;

public enum JobPostSyncQueueStatus
{
    Queued,
    InProgress,
    Completed,
    Failed,
}

public sealed class JobPostSyncQueueJob
{
    public Guid Id { get; set; }
    public Guid[] SourceIds { get; set; } = [];
    public string? SearchText { get; set; }
    public JobPostSyncQueueStatus Status { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; }
}
