using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Application.JobPosts.Models;

public sealed class JobPostDetailDto
{
    public required Guid Id { get; init; }
    public required string Description { get; init; }
    public required string? EmploymentType { get; init; }
    public required JobPostLocationDto[]? Locations { get; init; }
    public required string? ValidThrough { get; init; }
    public required string? RemoteType { get; init; }
    public required string[]? ApplicantLocations { get; init; }
    public required DateTime FetchedAt { get; init; }
}

public sealed class JobPostLocationDto
{
    public string? StreetAddress { get; init; }
    public string? City { get; init; }
    public string? State { get; init; }
    public string? PostalCode { get; init; }
    public string? Country { get; init; }
}
