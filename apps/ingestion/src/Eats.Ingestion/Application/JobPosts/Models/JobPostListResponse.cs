namespace Eats.Ingestion.Application.JobPosts.Models;

/// <summary>A page of job posts and the total matching count before pagination.</summary>
public sealed record JobPostListResponse(IReadOnlyList<JobPostDto> Data, int TotalCount);
