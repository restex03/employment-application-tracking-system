using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobPostService
{
    Task AddMany(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task Update(JobPost jobPost, CancellationToken cancellationToken = default);
    Task<JobPost> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default);

    public class Imp(
        IJobPostRepository jobPostRepository,
        IJobSourceRepository jobSourceRepository,
        IJobPostDiscoveryServiceFactory discoveryServiceFactory,
        ILogger<Imp> logger) 
    : IJobPostService
    {
        public Task AddMany(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return jobPostRepository.UpsertMany(jobPosts);
        }

        public Task Update(JobPost jobPost, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return jobPostRepository.Upsert(jobPost);
        }

        public async Task<JobPost> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            var jobPost = await jobPostRepository.GetByIdOrThrow(id);
            if (jobPost.Detail is null)
            {
                logger.LogDebug("Syncing details for job post {JobPostId}", jobPost.Id);
                var source = await GetSource(jobPost.SourceId, cancellationToken);
                var discoveryService = discoveryServiceFactory.Create(source);
                var detail = await discoveryService.FetchDetail(jobPost.DetailPath, cancellationToken);

                jobPost.UpdateFromDetail(detail.RequisitionId, detail.RemoteType);
                jobPost.HydrateDetail(detail.Detail);
            await jobPostRepository.Upsert(jobPost);
            }

            return jobPost;

        }

        private async Task<JobSource> GetSource(
            Guid sourceId,
            CancellationToken cancellationToken)
        {
            var source = await jobSourceRepository.GetByIdOrThrowAsync(sourceId, cancellationToken);
            return source ?? throw new InvalidOperationException($"Job source not found: {sourceId}");
        }

    }
}