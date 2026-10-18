namespace Eats.Ingestion.Application.JobPostDiscovery;

public sealed record JobPostDiscoveryRecord(
    string SourceId,
    string Title,
    string DetailPath,
    string? RequisitionId,
    string? Location,
    int? DaysOld,
    string? RemoteType);
