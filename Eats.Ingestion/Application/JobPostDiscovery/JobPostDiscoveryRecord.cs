using Eats.Ingestion.Application.JobPostSync;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public sealed record JobPostDiscoveryRecord(
    Guid SourceId,
    string Title,
    string DetailPath,
    string? RequisitionId,
    string? Location,
    int? DaysOld,
    string? RemoteType) : IJobScreenCriteria;
