using Eats.Ingestion.Application.JobPostSync;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public sealed record JobPostDiscovery(
    Guid SourceId,
    string Title,
    string DetailPath,
    Uri JobLink,
    string? RequisitionId,
    string? Location,
    int? DaysOld,
    string? RemoteType) : IJobScreenCriteria;
