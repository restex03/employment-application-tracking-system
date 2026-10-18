using Eats.Ingestion.Application.JobPostSync.Queue;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public interface IJobPostSyncQueue
{
    Task<Guid> Enqueue(
        IEnumerable<string> sourceIds,
        string? searchText,
        CancellationToken cancellationToken = default);

    Task<JobPostSyncQueueJob?> ClaimNext(CancellationToken cancellationToken = default);
    Task Complete(Guid jobId, CancellationToken cancellationToken = default);
    Task Fail(Guid jobId, string error, CancellationToken cancellationToken = default);
}
