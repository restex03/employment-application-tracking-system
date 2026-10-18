using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobSourceRepository
{
    Task<JobSource?> GetById(string id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobSource>> GetAll(CancellationToken cancellationToken = default);
    Task AddMany(IEnumerable<JobSource> jobSources, CancellationToken cancellationToken = default);
}
