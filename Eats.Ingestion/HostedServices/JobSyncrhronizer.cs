using Microsoft.FeatureManagement;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Application.FeatureFlags;

namespace Eats.Ingestion.HostedServices;

public sealed class JobSynchronizer(
    IServiceScopeFactory scopeFactory,
    IFeatureManager featureManager,
    ILogger<JobSynchronizer> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(1000);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {

        var isEnabled = await featureManager.IsEnabledAsync(FeatureConstants.JobSynchronizer);
        if (!isEnabled)
        {
            logger.LogInformation("Feature disabled: JobSynchronizer");
            return;
        }

        logger.LogInformation("Feature enabled: JobSynchronizer");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var queue = scope.ServiceProvider.GetRequiredService<ITaskQueue>();
                var queueTask = await queue.ClaimNext(stoppingToken);
                if (queueTask is null)
                {
                    await Task.Delay(PollInterval, stoppingToken);
                    continue;
                }

                logger.LogDebug("Processing JobPost synchronization task {Id}", queueTask.Id);
                var syncService = scope.ServiceProvider.GetRequiredService<IJobPostSyncService>();
                try
                {
                    await syncService.SyncJobPostsOrThrowAsync(queueTask.SourceId, queueTask.SearchText, stoppingToken);
                    await queue.Complete(queueTask.Id, stoppingToken);
                    
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    logger.LogError(exception, "JobPost synchronization task {Id} failed", queueTask.Id);
                    await queue.Fail(queueTask.Id, exception.Message, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "JobPost synchronization worker iteration failed");
                await Task.Delay(PollInterval, stoppingToken);
            }
        }
    }
}
