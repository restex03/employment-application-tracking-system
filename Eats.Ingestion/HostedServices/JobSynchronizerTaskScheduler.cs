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
            logger.LogInformation("Feature disabled: JobSynchronizer");
            return;
        }

        logger.LogInformation("Feature enabled: JobSynchronizer");

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

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var sourceRepository = scope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
                var queue = scope.ServiceProvider.GetRequiredService<ITaskQueue>();
                var sources = await sourceRepository.GetAllAsync(stoppingToken);
                foreach (var source in sources)
                {
                    await queue.Enqueue(
                        source.Id,
                        SearchText,
                        stoppingToken);
                }
                
                logger.LogInformation("Enqueued daily JobPost sync for {SourceCount} sources", sources.Count);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to enqueue the daily JobPost sync");
            }
        }
    }
}
