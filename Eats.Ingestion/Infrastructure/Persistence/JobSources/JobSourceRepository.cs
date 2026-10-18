using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public sealed class JobSourceRepository(JobPostDbContext dbContext) : IJobSourceRepository
{
    public Task<JobSource?> GetById(string id, CancellationToken cancellationToken = default)
    {
        return dbContext.JobSources
            .AsNoTracking()
            .FirstOrDefaultAsync(source => source.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<JobSource>> GetAll(CancellationToken cancellationToken = default)
    {
        return await dbContext.JobSources
            .AsNoTracking()
            .OrderBy(source => source.CompanyName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddMany(IEnumerable<JobSource> jobSources, CancellationToken cancellationToken = default)
    {
        await dbContext.JobSources.AddRangeAsync(jobSources, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
