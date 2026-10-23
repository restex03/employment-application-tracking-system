using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public interface IJobPostRepository
{
    Task UpsertAsync(JobPost jobPost, CancellationToken cancellationToken = default);
    Task UpsertManyAsync(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task<JobPost> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobPost>> ListAsync(JobPostQuery query, CancellationToken ct);
}
