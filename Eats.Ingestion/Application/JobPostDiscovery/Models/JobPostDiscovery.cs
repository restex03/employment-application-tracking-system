using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public sealed record JobPostDiscovery(
    Guid SourceId,
    string Title,
    string DetailPath,
    Uri JobLink,
    string? RequisitionId,
    string? Location,
    DateTime? PostedDate, 
    string? RemoteType) : IJobPostScreenCriteria;
