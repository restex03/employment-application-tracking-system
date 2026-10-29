using Microsoft.FeatureManagement;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Eats.Ingestion.Application.FeatureFlags;
using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.HostedServices;
public sealed class JobDetailHydrator(
    IServiceScopeFactory scopeFactory,
    IFeatureManager featureManager,
    ILogger<JobDetailHydrator> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval =
        TimeSpan.FromMinutes(15);

    private static readonly TimeSpan ThrottleInterval =
        TimeSpan.FromMilliseconds(500);

    private const int BatchCount = 10;
    private readonly Dictionary<Guid, JobSource> jobSourceCache = [];

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {

        var isEnabled = await featureManager.IsEnabledAsync(FeatureConstants.JobDetailHydrator);
        if (!isEnabled)
        {
            logger.LogInformation("Feature disabled: JobDetailHydrator");
            return;
        }

        logger.LogInformation("Feature enabled: JobDetailHydrator");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();

                var repository = scope.ServiceProvider
                    .GetRequiredService<IJobPostRepository>();

                var sourceRepository = scope.ServiceProvider
                    .GetRequiredService<IJobSourceRepository>();

                var discoveryFactory = scope.ServiceProvider
                    .GetRequiredService<IJobPostDiscoveryServiceFactory>();

                var batch = await repository.GetNextRandomDryBatchAsync(
                    BatchCount, stoppingToken);

                if (batch.Count == 0)
                {
                    logger.LogDebug("No job posts require detail hydration");
                    await ResetAndWait(PollInterval, stoppingToken);
                    continue;
                }

                logger.LogInformation(
                    "Hydrating a batch of {JobPostCount} job posts",
                    batch.Count);

                var failedCount = 0;

                foreach (var jobPost in batch)
                {
                    try
                    {
                        var source = await GetJobSource(jobPost.SourceId, sourceRepository);

                        var discoveryService =
                            discoveryFactory.Create(source);

                        var detail = await discoveryService.FetchDetail(
                            jobPost.DetailPath, stoppingToken);

                        jobPost.HydrateDetail(detail);

                        await repository.UpsertAsync(
                            jobPost, stoppingToken);
                    }
                    catch (OperationCanceledException)
                        when (stoppingToken.IsCancellationRequested)
                    {
                        throw;
                    }
                    catch (Exception ex)
                    {
                        failedCount++;

                        logger.LogError(
                            ex,
                            "Failed to hydrate job post {JobPostId}",
                            jobPost.Id);
                    }

                    await Task.Delay(
                        ThrottleInterval, stoppingToken);
                }

                logger.LogInformation(
                    "Completed job-post detail hydration batch: {SucceededCount} succeeded, {FailedCount} failed",
                    batch.Count - failedCount,
                    failedCount);

                // Cooldown period in case the entire batch fails
                if (failedCount == batch.Count)
                {
                    logger.LogWarning(
                        "All {JobPostCount} job posts in the hydration batch failed; pausing before retry",
                        batch.Count);
                    await ResetAndWait(PollInterval, stoppingToken);
                }
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception ex)
            {
                logger.LogError(
                    ex, "JobPost detail hydrator iteration failed");

                try
                {
                    await ResetAndWait(PollInterval, stoppingToken);
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
            }
        }

        logger.LogInformation("JobPost detail hydrator stopped");
    }

    private async Task ResetAndWait(TimeSpan delay, CancellationToken stoppingToken)
    {
        jobSourceCache.Clear();
        await Task.Delay(delay, stoppingToken);

    }

    private async Task<JobSource> GetJobSource(Guid sourceId, IJobSourceRepository sourceRepository)
    {
        if (jobSourceCache.TryGetValue(sourceId, out var cachedSource))
        {
            return cachedSource;
        }

        var source = await sourceRepository.GetByIdOrThrowAsync(sourceId);
        jobSourceCache.Add(sourceId, source);
        return source;
    }
}
