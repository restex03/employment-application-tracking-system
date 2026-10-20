using System.Data;
using Eats.Ingestion.Application.JobPostSync.Queue;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public sealed class JobPostSyncQueueRepository(JobPostDbContext dbContext) : IJobPostSyncQueue
{
    public async Task<Guid> Enqueue(
        IEnumerable<Guid> sourceIds,
        string? searchText,
        CancellationToken cancellationToken = default)
    {
        var distinctSourceIds = sourceIds.Distinct().ToArray();
        var job = new JobPostSyncQueueJob
        {
            Id = Guid.NewGuid(),
            SourceIds = distinctSourceIds,
            SearchText = searchText,
            Status = JobPostSyncQueueStatus.Queued,
            CreatedAt = DateTime.UtcNow,
        };

        dbContext.JobPostSyncQueueJobs.Add(job);
        await dbContext.SaveChangesAsync(cancellationToken);
        return job.Id;
    }

    public async Task<JobPostSyncQueueJob?> ClaimNext(CancellationToken cancellationToken = default)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(
            IsolationLevel.ReadCommitted,
            cancellationToken);
        var connection = dbContext.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = """
            SELECT "Id"
            FROM "JobPostSyncQueueJob"
            WHERE "Status" = @queuedStatus
            ORDER BY "CreatedAt"
            FOR UPDATE SKIP LOCKED
            LIMIT 1
            """;

        var statusParameter = command.CreateParameter();
        statusParameter.ParameterName = "queuedStatus";
        statusParameter.Value = (int)JobPostSyncQueueStatus.Queued;
        command.Parameters.Add(statusParameter);

        var result = await command.ExecuteScalarAsync(cancellationToken);
        if (result is null or DBNull)
        {
            await transaction.CommitAsync(cancellationToken);
            return null;
        }

        var jobId = (Guid)result;
        var job = await dbContext.JobPostSyncQueueJobs
            .FirstAsync(candidate => candidate.Id == jobId, cancellationToken);
        job.Status = JobPostSyncQueueStatus.InProgress;
        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return job;
    }

    public async Task Complete(Guid jobId, CancellationToken cancellationToken = default)
    {
        var updated = await dbContext.JobPostSyncQueueJobs
            .Where(job => job.Id == jobId && job.Status == JobPostSyncQueueStatus.InProgress)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(job => job.Status, JobPostSyncQueueStatus.Completed)
                    .SetProperty(job => job.Error, (string?)null),
                cancellationToken);
        if (updated != 1)
        {
            throw new InvalidOperationException($"Unable to complete in-progress job: {jobId}");
        }
    }

    public async Task Fail(Guid jobId, string error, CancellationToken cancellationToken = default)
    {
        var updated = await dbContext.JobPostSyncQueueJobs
            .Where(job => job.Id == jobId && job.Status == JobPostSyncQueueStatus.InProgress)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(job => job.Status, JobPostSyncQueueStatus.Failed)
                    .SetProperty(job => job.Error, error),
                cancellationToken);
        if (updated != 1)
        {
            throw new InvalidOperationException($"Unable to fail in-progress job: {jobId}");
        }
    }
}
