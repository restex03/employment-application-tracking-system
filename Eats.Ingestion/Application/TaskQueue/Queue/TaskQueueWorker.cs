using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

namespace Eats.Ingestion.Application.JobPostSync.Queue;

public sealed class TaskQueueWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<TaskQueueWorker> logger) : BackgroundService
{
    private static readonly TimeSpan PollInterval = TimeSpan.FromMilliseconds(1000);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var queue = scope.ServiceProvider.GetRequiredService<ITaskQueue>();
                var job = await queue.ClaimNext(stoppingToken);
                if (job is null)
                {
                    await Task.Delay(PollInterval, stoppingToken);
                    continue;
                }

                logger.LogDebug("Processing job-post sync queue item {JobId}", job.Id);
                var syncService = scope.ServiceProvider.GetRequiredService<IJobPostSyncService>();
                try
                {
                    await syncService.SyncJobPostsOrThrowAsync(job.SourceIds, job.SearchText, stoppingToken);
                    await queue.Complete(job.Id, stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    throw;
                }
                catch (Exception exception)
                {
                    logger.LogError(exception, "Job-post sync queue item {JobId} failed", job.Id);
                    await queue.Fail(job.Id, exception.Message, stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Job-post sync queue worker iteration failed");
                await Task.Delay(PollInterval, stoppingToken);
            }
        }
    }
}
