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
   
    


    Task<QueueTaskViewModel> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Guid> AddAsync(JobPostSyncTask task, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueTaskViewModel>> GetAllActiveAsync(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueTaskViewModel>> GetAllAsync(CancellationToken cancellationToken = default);

    public sealed class Imp(
        ITaskQueue taskQueue,
        ILogger<Imp> logger) 
    : ITaskQueueService
    {

        public async Task<QueueTaskViewModel> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
        {
            logger.LogDebug($"[ITaskQueueService.Imp.GetByIdOrThrowAsync] Getting queue task by id {id}", id);
            var qt = await taskQueue.GetTaskByIdOrThrowAsync(id, cancellationToken);
            var result = MapToViewModel(qt);
            return result;
        }

        public async Task<IReadOnlyList<QueueTaskViewModel>> GetAllActiveAsync(CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.GetAllActiveAsync] Getting all active queue tasks");
            var result = await taskQueue.GetAllActive(cancellationToken);
            return result.Select(MapToViewModel).ToList();
        }

        public async Task<IReadOnlyList<QueueTaskViewModel>> GetAllAsync(CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.GetAllAsync] Getting all queue tasks");
            var result = await taskQueue.GetAllAsync(cancellationToken);
            return result.Select(MapToViewModel).ToList();
        }

        public async Task<Guid> AddAsync(JobPostSyncTask task, CancellationToken cancellationToken = default)
        {
            logger.LogDebug("[ITaskQueueService.Imp.AddAsync] Adding a new queue task with search text {SearchText} and source ids {SourceIds}", task.SearchText, task.SourceIds);

            var jobId = await taskQueue.Enqueue(
                task.SourceIds,
                task.SearchText,
                cancellationToken);

            return jobId;

        }

        private static QueueTaskViewModel MapToViewModel(QueueTask task)
        {
            var status = task.Status switch
            {
                QueueTaskStatusDomain.Queued => QueueTaskStatus.Queued,
                QueueTaskStatusDomain.InProgress => QueueTaskStatus.InProgress,
                QueueTaskStatusDomain.Completed => QueueTaskStatus.Completed,
                QueueTaskStatusDomain.Failed => QueueTaskStatus.Failed,
                _ => throw new InvalidOperationException($"Unknown status: {task.Status}")
            };
            return new QueueTaskViewModel
            {
                Id = task.Id,
                Status = status,
                Error = task.Error,
                CreatedAt = task.CreatedAt
            };
        }
    }
}
