using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync.Queue;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

namespace Eats.Ingestion.Application.JobPostSync;

public interface ITaskQueueService
{
    Task<QueueTaskDto> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobPostSyncQueueTask>> AddAsync(JobPostSyncTask task, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueTaskDto>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueTaskDto>> GetAllAsync(CancellationToken cancellationToken = default);

    public sealed class Imp(
        ITaskQueue taskQueue,
        IJobSourceRepository sourceRepository,
        ILogger<Imp> logger) 
    : ITaskQueueService
    {

        public async Task<QueueTaskDto> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
        {
            logger.LogDebug($"[ITaskQueueService.Imp.GetByIdOrThrowAsync] Getting queue task by id {id}", id);
            var qt = await taskQueue.GetTaskByIdOrThrowAsync(id, cancellationToken);
            var result = MapToViewModel(qt);
            return result;
        }

        public async Task<IReadOnlyList<QueueTaskDto>> GetAllActiveAsync(CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.GetAllActiveAsync] Getting all active queue tasks");
            var result = await taskQueue.GetAllActive(cancellationToken);
            return result.Select(MapToViewModel).ToList();
        }

        public async Task<IReadOnlyList<QueueTaskDto>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.GetAllAsync] Getting all queue tasks");
            var result = await taskQueue.GetAllAsync(cancellationToken);
            return result.Select(MapToViewModel).ToList();
        }

        public async Task<IReadOnlyList<JobPostSyncQueueTask>> AddAsync(JobPostSyncTask task, CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.AddAsync] Adding a new queue task with search text {SearchText} and source ids {SourceIds}", task.SearchText, task.SourceIds);
            var queueTasks = new List<JobPostSyncQueueTask>(); 
            var sourceIds = task.SourceIds.Any()
            ?  task.SourceIds
            : (await sourceRepository.GetAllAsync(cancellationToken)).Select(s => s.Id);
            foreach (var sourceId in sourceIds)
            {
                var jobId = await taskQueue.Enqueue(
                    sourceId,
                    task.SearchText,
                    cancellationToken);

                queueTasks.Add(new JobPostSyncQueueTask { SourceId = sourceId, JobId = jobId });
            }
            return queueTasks;
        }

        private static QueueTaskDto MapToViewModel(QueueTask task)
        {
            var status = task.Status switch
            {
                QueueTaskStatusDomain.Queued => QueueTaskStatus.Queued,
                QueueTaskStatusDomain.InProgress => QueueTaskStatus.InProgress,
                QueueTaskStatusDomain.Completed => QueueTaskStatus.Completed,
                QueueTaskStatusDomain.Failed => QueueTaskStatus.Failed,
                _ => throw new InvalidOperationException($"Unknown status: {task.Status}")
            };
            return new QueueTaskDto
            {
                Id = task.Id,
                Status = status,
                Error = task.Error,
                CreatedAt = task.CreatedAt,
                CompletedAt = task.CompletedAt
            };
        }
    }
}

public class JobPostSyncQueueTask
{
    public required Guid SourceId { get; init; }
    public required Guid JobId { get; init; }
}