using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public interface IJobPostRepository
{
    Task UpsertAsync(JobPost jobPost, CancellationToken cancellationToken = default);
    Task UpsertManyAsync(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task<JobPost> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobPost>> ListAsync(JobPostQuery query, CancellationToken ct = default);
    
    /// <summary>
    /// Gets the next batch of job posts that have no detail populated, ordered randomly.
    /// </summary>
    /// <param name="count">The number of job posts to retrieve.</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A list of job posts with no detail populated, ordered randomly.</returns>
    Task<IReadOnlyList<JobPost>> GetNextRandomDryBatchAsync(int count = 10, CancellationToken cancellationToken = default);
}
