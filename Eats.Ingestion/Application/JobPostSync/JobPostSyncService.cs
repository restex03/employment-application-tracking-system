using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

namespace Eats.Ingestion.Application.JobPostSync;

public sealed class JobPostSyncService(
    IJobPostDiscoveryServiceFactory discoveryServiceFactory,
    IJobSourceRepository jobSourceRepository,
    IJobPostRepository jobPostRepository,
    IJobPostScreener screener,
    ILogger<JobPostSyncService> logger) : IJobPostSyncService
{
    public async Task SyncJobs(
        IEnumerable<string> sourceIds,
        string? searchText = null,
        CancellationToken cancellationToken = default)
    {
        var sources = await Task.WhenAll(sourceIds.Select(async sourceId =>
            await GetSource(sourceId, cancellationToken)));
        var sourcesSynced = 0;
        var jobsDiscovered = 0;

        foreach (var source in sources)
        {
            try
            {
                logger.LogDebug("Syncing job posts from source {CompanyName}", source.CompanyName);
                var discoveryService = discoveryServiceFactory.Create(source);
                var discoveredJobs = await discoveryService.FetchList(searchText, cancellationToken);
                var jobPosts = discoveredJobs
                    .Where(screener.ScreenJobPost)
                    .Select(CreateJobPost)
                    .ToArray();

                await jobPostRepository.UpsertMany(jobPosts);
                sourcesSynced++;
                jobsDiscovered += jobPosts.Length;
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                logger.LogError(exception, "Failed to sync job posts from source {CompanyName}", source.CompanyName);
            }
        }

        logger.LogDebug(
            "Synced {SourcesSynced} sources and discovered {JobsDiscovered} jobs",
            sourcesSynced,
            jobsDiscovered);
        logger.LogDebug("Completed syncing all job sources");
    }

    public async Task SyncJobDetails(Guid jobPostId, CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Syncing details for job post {JobPostId}", jobPostId);
        var jobPost = await jobPostRepository.GetByIdOrThrow(jobPostId);
        var source = await GetSource(jobPost.SourceId, cancellationToken);
        var discoveryService = discoveryServiceFactory.Create(source);
        var detail = await discoveryService.FetchDetail(jobPost.Id, jobPost.DetailPath, cancellationToken);

        jobPost.UpdateFromDetail(detail.RequisitionId, detail.Title, detail.RemoteType);
        jobPost.HydrateDetail(detail.Detail);
        await jobPostRepository.Upsert(jobPost);
    }

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

    public Task<JobPost> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return jobPostRepository.GetByIdOrThrow(id);
    }

    private async Task<JobSource> GetSource(
        string sourceId,
        CancellationToken cancellationToken)
    {
        var source = await jobSourceRepository.GetById(sourceId, cancellationToken);
        return source ?? throw new InvalidOperationException($"Job source not found: {sourceId}");
    }

    private static JobPost CreateJobPost(JobPostDiscoveryRecord discovery)
    {
        return new JobPost(
            Guid.NewGuid(),
            discovery.SourceId,
            discovery.Title,
            discovery.DetailPath,
            DateTime.UtcNow,
            discovery.RequisitionId,
            discovery.Location,
            discovery.DaysOld,
            remoteType: discovery.RemoteType);
    }
}
