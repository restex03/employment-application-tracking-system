using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Eats.Ingestion.Application.JobPostSync.Queue;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;


namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public interface ITaskQueue
{
    Task<Guid> Enqueue(
        Guid sourceId,
        string? searchText,
        CancellationToken cancellationToken = default);

    Task<QueueTask?> ClaimNext(CancellationToken cancellationToken = default);
    Task Complete(Guid jobId, CancellationToken cancellationToken = default);
    Task Fail(Guid jobId, string error, CancellationToken cancellationToken = default);
    Task<QueueTask> GetTaskByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<QueueTask>> GetAllActive(CancellationToken cancellationToken = default);
    Task<IEnumerable<QueueTask>> GetAllAsync(CancellationToken cancellationToken = default);

    public sealed class Imp(EatsIngestionDbContext dbContext) : ITaskQueue
{
    public async Task<Guid> Enqueue(
        Guid sourceId,
        string? searchText,
        CancellationToken cancellationToken = default)
    {
        if (sourceId == Guid.Empty)
        {
            throw new InvalidOperationException("SourceId cannot be empty.");
        }
        var job = new QueueTask(
            sourceId,
            searchText,
            QueueTaskStatusDomain.Queued,
            DateTime.UtcNow
        );
        dbContext.QueueTasks.Add(job);
        await dbContext.SaveChangesAsync(cancellationToken);
        return job.Id;
    }

    public async Task<QueueTask?> ClaimNext(CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);
        var connection = dbContext.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = """
            SELECT "Id"
            FROM "QueueTasks"
            WHERE "Status" = @queuedStatus
            ORDER BY "CreatedAt"
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """;

        var statusParameter = command.CreateParameter();
        statusParameter.ParameterName = "queuedStatus";
        statusParameter.Value = (int)QueueTaskStatusDomain.Queued;
        command.Parameters.Add(statusParameter);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        if (result is null or DBNull)
        {
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        var jobId = (Guid)result;
        var job = await dbContext.QueueTasks
            .FirstAsync(candidate => candidate.Id == jobId, cancellationToken);
        job.SetStatus(QueueTaskStatusDomain.InProgress);
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return job;
    }

    public async Task Complete(Guid jobId, CancellationToken cancellationToken = default)
    {
        var updated = await dbContext.QueueTasks
            .Where(job => job.Id == jobId && job.Status == QueueTaskStatusDomain.InProgress)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(job => job.Status, QueueTaskStatusDomain.Completed)
                    .SetProperty(job => job.CompletedAt, DateTime.UtcNow)
                    .SetProperty(job => job.Error, (string?)null),
                cancellationToken);
        if (updated != 1)
        {
            throw new InvalidOperationException($"Unable to complete in-progress job: {jobId}");
        }
    }

    public async Task Fail(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        var updated = await dbContext.QueueTasks
            .Where(job => job.Id == jobId && job.Status == QueueTaskStatusDomain.InProgress)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(job => job.Status, QueueTaskStatusDomain.Failed)
                    .SetProperty(job => job.CompletedAt, DateTime.UtcNow)
                    .SetProperty(job => job.Error, error),
                cancellationToken);
        if (updated != 1)
        {
            throw new InvalidOperationException($"Unable to fail in-progress job: {jobId}");
        }
    }

        public async Task<QueueTask> GetTaskByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var result = await dbContext.QueueTasks
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
                ?? throw new NullReferenceException($"Task not found: {id}");
           
            return result;
        }

        public async Task<IReadOnlyList<QueueTask>> GetAllActive(CancellationToken cancellationToken = default)
        {
            var acceptedStatuses = new[] { QueueTaskStatusDomain.Queued, QueueTaskStatusDomain.InProgress }; 
            var results = await dbContext.QueueTasks
                .Where(job => acceptedStatuses.Contains(job.Status))
                .ToListAsync(cancellationToken);
            return results;
        }

        public async Task<IEnumerable<QueueTask>> GetAllAsync(CancellationToken cancellationToken)
        {
            var results = await dbContext.QueueTasks
                    .ToListAsync(cancellationToken);
            return results;
        }
    }

}
