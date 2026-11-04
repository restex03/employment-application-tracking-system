using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public interface IJobPostRepository
{
    /// <summary>
    /// Upserts a job post into the repository. If the job post already exists, some (but not all) fields are updated; otherwise, it will be inserted.
    /// </summary>
    /// <param name="jobPost"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task UpsertAsync(JobPost jobPost, CancellationToken cancellationToken = default);

    /// <summary>
    /// Updates an existing detached job post and inserts its newly hydrated detail, if present.
    /// Detaches both entities after saving, including when saving fails.
    /// </summary>
    /// <param name="jobPost"></param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task PersistHydrationAsync(JobPost jobPost, CancellationToken cancellationToken = default);
    Task UpsertManyAsync(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task<JobPost> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobPost>> ListAsync(JobPostQuery query, CancellationToken ct = default);
    Task<int> CountAsync(JobPostQuery query, CancellationToken ct = default);
    
    /// <summary>
    /// Gets the next batch of job posts that have no detail populated, ordered randomly.
    /// </summary>
    /// <param name="count">The number of job posts to retrieve.</param>
    /// <param name="cancellationToken">A token to monitor for cancellation requests.</param>
    /// <returns>A list of job posts with no detail populated, ordered randomly.</returns>
    Task<IReadOnlyList<JobPost>> GetNextRandomDryBatchAsync(int count = 10, CancellationToken cancellationToken = default);
}
