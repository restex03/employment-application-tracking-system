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
    public QueueTask(Guid sourceId, string? searchText, QueueTaskStatusDomain status, DateTime createdAt)
    {
        SourceId = sourceId;
        SearchText = searchText;
        Status = status;
        CreatedAt = createdAt;
    }
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid SourceId { get; private set; }
    public string? SearchText { get; private set; }
    public QueueTaskStatusDomain Status { get; private set; }
    public string? Error { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }

    internal void SetStatus(QueueTaskStatusDomain status)
    {
        Status = status;
    }

    internal void SetError(string? error)
    {
        Error = error;
    }

    internal void SetCompleted()
    {
        CompletedAt = DateTime.UtcNow;
    }
}
