using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public interface IJobPostDiscoveryService
{
    Task<IReadOnlyList<JobPostDiscoveryDto>> FetchList(
        string? searchText = null,
        CancellationToken cancellationToken = default);

    Task<JobPostDetailDiscovery> FetchDetail(
        string detailPath,
        CancellationToken cancellationToken = default);
}
