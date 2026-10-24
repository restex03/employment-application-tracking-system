namespace Eats.Ingestion.Domain.JobPosts;

public sealed record JobPostDetailDiscovery(
    string Description,
    string? RequisitionId,
    string Title,
    string? RemoteType,
    string? EmploymentType = null,
    JobPostLocation[]? Locations = null,
    string? ValidThrough = null,
    string[]? ApplicantLocations = null,
    DateTime FetchedAt = default);
