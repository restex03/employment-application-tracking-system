using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public sealed record JobPostDetailDiscovery(
    JobPostDetail Detail,
    string? RequisitionId,
    string Title,
    string? RemoteType);
