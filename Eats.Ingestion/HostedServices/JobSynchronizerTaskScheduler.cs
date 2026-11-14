using System.Diagnostics;
using System.Globalization;
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
    private static readonly string[] IsoTimeFormats = ["HH:mm:ss", "HH:mm"];
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

        // A recurring local wall-clock time needs both an ISO 8601 time and an IANA
        // timezone. A fixed UTC offset alone would not account for daylight saving time.
        var scheduleTimeText = configuration["Ingestion:ScheduleTime"]
            ?? throw new InvalidOperationException("Ingestion:ScheduleTime is required (e.g. 05:00:00).");
        if (!TimeOnly.TryParseExact(
                scheduleTimeText,
                IsoTimeFormats,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out var scheduleTime))
        {
            throw new InvalidOperationException(
                $"Invalid Ingestion:ScheduleTime '{scheduleTimeText}'. Expected HH:mm:ss or HH:mm.");
        }

        var timeZoneId = configuration["Ingestion:ScheduleTimeZone"]
            ?? throw new InvalidOperationException("Ingestion:ScheduleTimeZone is required.");
        var timeZone = TimeZoneInfo.FindSystemTimeZoneById(timeZoneId);

        while (!stoppingToken.IsCancellationRequested)
        {
            var nextRunUtc = GetNextRunUtc(DateTimeOffset.UtcNow, scheduleTime, timeZone);
            var delay = nextRunUtc - DateTime.UtcNow;

            logger.LogInformation(
                "Next daily job-post sync scheduled for {NextRunUtc} UTC ({ScheduleTime} in {ScheduleTimeZone})",
                nextRunUtc, scheduleTime.ToString("HH:mm:ss", CultureInfo.InvariantCulture), timeZoneId);
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
    internal static DateTime GetNextRunUtc(
        DateTimeOffset nowUtc, TimeOnly scheduleTime, TimeZoneInfo timeZone)
    {
        var localNow = TimeZoneInfo.ConvertTime(nowUtc, timeZone);
        var candidateDate = localNow.Date;

        while (true)
        {
            var candidateLocal = candidateDate.Add(scheduleTime.ToTimeSpan());

            // A spring-forward gap has no corresponding UTC instant.
            // Run at the earliest valid minute after the gap on that day.
            while (timeZone.IsInvalidTime(candidateLocal))
            {
                candidateLocal = candidateLocal.AddMinutes(1);
            }

            // Ambiguous fall-back times resolve to standard time (the later
            // occurrence). Compare actual UTC instants, not local wall-clock
            // values, so the second occurrence is not accidentally skipped.
            var candidateUtc = TimeZoneInfo.ConvertTimeToUtc(candidateLocal, timeZone);
            if (candidateUtc > nowUtc.UtcDateTime)
            {
                return candidateUtc;
            }

            candidateDate = candidateDate.AddDays(1);
        }
    }

}
