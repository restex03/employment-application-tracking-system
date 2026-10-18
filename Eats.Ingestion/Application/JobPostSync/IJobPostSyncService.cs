using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Application.JobPostSync;

public interface IJobPostSyncService
{
    Task SyncJobs(IEnumerable<string> sourceIds, string? searchText = null, CancellationToken cancellationToken = default);
    Task SyncJobDetails(Guid jobPostId, CancellationToken cancellationToken = default);
    Task AddMany(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task Update(JobPost jobPost, CancellationToken cancellationToken = default);
    Task<JobPost> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default);
}
