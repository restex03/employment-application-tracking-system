namespace Eats.Ingestion.Application.JobPosts.Models;
public sealed class JobPostQuery
{
    public required int PageCount { get; init; } = 20;
    public required int PageNumber { get; init; } = 1;
    public required string? CompanyName { get; init; }
    public required string? RequisitionId { get; init; }
    public required string? Title { get; init; }
    public required string? Location { get; init; }
    public required DateTime? PostedDate { get; init; }
    public required double? JobMatchScore { get; init; }
    public required string? ApplicationStatus { get; init; }
    public JobPostSortBy? SortBy { get; init; } = JobPostSortBy.PostedDate;
    public SortDirection? SortDirection { get; init; } = SortDirection.Descending;
}