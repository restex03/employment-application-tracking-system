
public sealed class QueueTaskDto
{
    public required Guid Id { get; init; }
    public required QueueTaskStatus Status { get; init; }
    public string? Error { get; init; }
    public required DateTime CreatedAt { get; init; }
    public DateTime? CompletedAt { get; init; }
}

