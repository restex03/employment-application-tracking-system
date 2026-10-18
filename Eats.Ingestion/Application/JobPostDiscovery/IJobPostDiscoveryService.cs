namespace Eats.Ingestion.Application.JobPostDiscovery;

public interface IJobPostDiscoveryService
{
    Task<IReadOnlyList<JobPostDiscoveryRecord>> FetchList(
        string? searchText = null,
        CancellationToken cancellationToken = default);

    Task<JobPostDetailDiscovery> FetchDetail(
        Guid jobPostId,
        string detailPath,
        CancellationToken cancellationToken = default);
}
