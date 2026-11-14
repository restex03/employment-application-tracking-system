using System.Diagnostics;
using Microsoft.FeatureManagement;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Eats.Ingestion.Application.FeatureFlags;


namespace Eats.Ingestion.HostedServices;

public sealed class JobSynchronizerTaskScheduler(
    IServiceScopeFactory scopeFactory,
    IFeatureManager featureManager,
    IConfiguration configuration,
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

        // The schedule is Eastern by default, regardless of the Docker host timezone.
        var timeZoneId = configuration["Ingestion:ScheduleTimeZone"]
            ?? "America/New_York";
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);

        while (!stoppingToken.IsCancellationRequested)
        {
            var nowUtc = DateTimeOffset.UtcNow;
            var localNow = TimeZoneInfo.ConvertTime(nowUtc, timeZone);
            var nextLocal = localNow.Date.AddHours(RunHour).AddMinutes(RunMinute);
            if (nextLocal <= localNow.DateTime)
            {
                nextLocal = nextLocal.AddDays(1);
            }

            var nextRunUtc = TimeZoneInfo.ConvertTimeToUtc(
                DateTime.SpecifyKind(nextLocal, DateTimeKind.Unspecified), timeZone);
            var delay = nextRunUtc - DateTime.UtcNow;

            logger.LogInformation(
                "Next daily job-post sync scheduled for {NextRunUtc} UTC ({ScheduleTimeZone} local time)",
                nextRunUtc, timeZoneId);
            await Task.Delay(delay > TimeSpan.Zero ? delay : TimeSpan.Zero, stoppingToken);

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
