using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public interface IJobPostRepository
{
    Task Upsert(JobPost jobPost);
    Task UpsertMany(IEnumerable<JobPost> jobPosts);
    Task<JobPost> GetByIdOrThrow(Guid id);
}
