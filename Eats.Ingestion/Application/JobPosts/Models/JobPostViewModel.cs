namespace Eats.Ingestion.Application.JobPosts.Models;

public sealed class JobPostViewModel
{
    public required Guid Id { get; init; }
    public required Guid SourceId { get; init; }
    public required string? RequisitionId { get; init; }
    public required string Title { get; init; }
    public required string DetailPath { get; init; }
    public required string? Location { get; init; }
    public required int? DaysOld { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required JobPostDetailViewModel? Detail { get; init; }
    public required string? RemoteType { get; init; }
}