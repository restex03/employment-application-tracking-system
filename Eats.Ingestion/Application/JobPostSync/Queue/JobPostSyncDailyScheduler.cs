using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

namespace Eats.Ingestion.Application.JobPostSync.Queue;

public sealed class JobPostSyncDailyScheduler(
    IServiceScopeFactory scopeFactory,
    ILogger<JobPostSyncDailyScheduler> logger) : BackgroundService
{
    private const int RunHour = 5;
    private const int RunMinute = 0;
    private const string SearchText = "software engineer";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.Now;
            var nextRun = now.Date.AddHours(RunHour).AddMinutes(RunMinute);
            if (nextRun <= now)
            {
                nextRun = nextRun.AddDays(1);
            }

            logger.LogInformation("Next daily job-post sync scheduled for {NextRun}", nextRun);
            await Task.Delay(nextRun - now, stoppingToken);

            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var sourceRepository = scope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
                var queue = scope.ServiceProvider.GetRequiredService<IJobPostSyncQueue>();
                var sources = await sourceRepository.GetAllAsync(stoppingToken);
                var jobId = await queue.Enqueue(
                    sources.Select(source => source.Id),
                    SearchText,
                    stoppingToken);
                logger.LogInformation("Enqueued daily job-post sync {JobId}", jobId);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to enqueue the daily job-post sync");
            }
        }
    }
}
