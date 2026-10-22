using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobSourceRepository
{
    Task<JobSource> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<JobSource>> GetRangeAsync(IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken = default);

    Task<List<JobSource>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddManyAsync(IEnumerable<JobSource> jobSources, CancellationToken cancellationToken = default);
    Task<List<JobSource>> GetByCompanyNameAsync(string companyName, CancellationToken cancellationToken = default);
}
