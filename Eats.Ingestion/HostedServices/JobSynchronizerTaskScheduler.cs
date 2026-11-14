using System.Diagnostics;
using Microsoft.FeatureManagement;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Eats.Ingestion.Application.FeatureFlags;


namespace Eats.Ingestion.HostedServices;

public sealed class JobSynchronizerTaskScheduler(
    IServiceScopeFactory scopeFactory,
    IFeatureManager featureManager,
    ILogger<JobSynchronizerTaskScheduler> logger) : BackgroundService
{
    private const int RunHour = 5;
    private const int RunMinute = 0;
    private const string SearchText = "software engineer";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var isEnabled = await featureManager.IsEnabledAsync(FeatureConstants.JobSynchronizer);
        if (!isEnabled)
        {
            logger.LogInformation("Feature disabled: {Feature}", FeatureConstants.JobSynchronizer);
            return;
        }

        logger.LogInformation("Feature enabled: {Feature}", FeatureConstants.JobSynchronizer);

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddHours(RunHour).AddMinutes(RunMinute);
            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            logger.LogInformation("Next daily JobPost sync scheduled for {NextRun}", nextRun);
            await Task.Delay(nextRun - now, stoppingToken);

            var syncBatchId = Guid.NewGuid();
            try
            {
                await using var serviceScope = scopeFactory.CreateAsyncScope();
                var sourceRepository = serviceScope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
                var queue = serviceScope.ServiceProvider.GetRequiredService<ITaskQueue>();
                var sources = await sourceRepository.GetAllAsync(stoppingToken);

                using var scope = logger.BeginScope(
                    new Dictionary<string, object>
                    {
                        ["SyncBatchId"] = syncBatchId,
                        ["Pipeline"] = "JobSynchronizer"
                    });

                logger.LogInformation("Created daily JobPost sync batch for {JobSourceCount} sources", sources.Count);

                var stopwatch = Stopwatch.StartNew();
                var enqueuedCount = 0;
                try
                {
                    foreach (var source in sources)
                    {
                        await queue.Enqueue(
                            syncBatchId: syncBatchId,
                            source.Id,
                            SearchText,
                            stoppingToken);
                        enqueuedCount++;
                    }
                }
                catch (Exception) when (enqueuedCount > 0 && !stoppingToken.IsCancellationRequested)
                {
                    logger.LogWarning(
                        "Partially enqueued daily JobPost sync: {EnqueuedCount} of {JobSourceCount} tasks before failure",
                        enqueuedCount,
                        sources.Count);
                    throw;
                }

                stopwatch.Stop();
                logger.LogInformation(
                    "Enqueued {EnqueuedCount} daily JobPost sync tasks in {DurationMs}ms",
                    enqueuedCount,
                    stopwatch.ElapsedMilliseconds);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to enqueue the daily JobPost sync batch {SyncBatchId}", syncBatchId);
            }
        }
    }
}
