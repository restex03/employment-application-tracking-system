using System.Diagnostics;
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
                await using var serviceScope = scopeFactory.CreateAsyncScope();
                var queue = serviceScope.ServiceProvider.GetRequiredService<ITaskQueue>();
                var queueTask = await queue.ClaimNext(stoppingToken);
                if (queueTask is null)
                {
                    await Task.Delay(PollInterval, stoppingToken);
                    continue;
                }

                var runId = Guid.NewGuid();
                using var scope = logger.BeginScope(
                    new Dictionary<string, object>
                    {
                        ["SyncBatchId"] = queueTask.SyncBatchId,
                        ["QueueTaskId"] = queueTask.Id,
                        ["RunId"] = runId,
                        ["JobSourceId"] = queueTask.SourceId,
                        ["Pipeline"] = "JobSynchronizer"
                    });

                logger.LogDebug("Processing JobPost synchronization task {Id}", queueTask.Id);
                var syncService = serviceScope.ServiceProvider.GetRequiredService<IJobPostSyncService>();
                var stopwatch = Stopwatch.StartNew();
                try
                {
                    await syncService.SyncJobPostsOrThrowAsync(queueTask.SourceId, queueTask.SearchText, stoppingToken);
                    await queue.Complete(queueTask.Id, stoppingToken);
                    stopwatch.Stop();
                    logger.LogInformation(
                        "JobPost synchronization task {Id} completed in {DurationMs}ms",
                        queueTask.Id,
                        stopwatch.ElapsedMilliseconds);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    stopwatch.Stop();
                    logger.LogError(
                        exception,
                        "JobPost synchronization task {Id} failed after {DurationMs}ms",
                        queueTask.Id,
                        stopwatch.ElapsedMilliseconds);
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
