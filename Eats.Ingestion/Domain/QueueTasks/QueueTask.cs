namespace Eats.Ingestion.Application.JobPostSync.Queue;



public enum QueueTaskStatusDomain
{
    Queued,
    InProgress,
    Completed,
    Failed
}

public sealed class QueueTask
{
    public Guid Id { get; set; }
    public Guid[] SourceIds { get; set; } = [];
    public string? SearchText { get; set; }
    public QueueTaskStatusDomain Status { get; set; }
    public string? Error { get; set; }
    public DateTime CreatedAt { get; set; }
}
