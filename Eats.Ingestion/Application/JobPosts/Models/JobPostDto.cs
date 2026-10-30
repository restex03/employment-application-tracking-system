namespace Eats.Ingestion.Application.JobPosts.Models;

public sealed class JobPostDto
{
    public required Guid Id { get; init; }
    public required Guid SourceId { get; init; }
    public required string? RequisitionId { get; init; }
    public required string Title { get; init; }
    public required string DetailPath { get; init; }
    public required string? Location { get; init; }
    public required DateTime CreatedAt { get; init; }
    public required JobPostDetailDto? Detail { get; init; }
    public required string? RemoteType { get; init; }
    public required DateTime? PostedDate { get; init; }
}