using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Microsoft.EntityFrameworkCore;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public sealed class JobSourceRepository(JobPostDbContext dbContext) : IJobSourceRepository
{
    public async Task<JobSource> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await dbContext.JobSources
            .AsNoTracking()
            .FirstOrDefaultAsync(source => source.Id == id, cancellationToken) 
            ?? throw new KeyNotFoundException($"JobSource with Id '{id}' not found.");
        return result;
    }

    public async Task<List<JobSource>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await dbContext.JobSources
            .AsNoTracking()
            .OrderBy(source => source.CompanyName)
            .ToListAsync(cancellationToken);
    }

    public async Task AddManyAsync(IEnumerable<JobSource> jobSources, CancellationToken cancellationToken = default)
    {
        await dbContext.JobSources.AddRangeAsync(jobSources, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task<List<JobSource>> GetRangeAsync(
        IReadOnlyCollection<Guid> ids,
        CancellationToken cancellationToken = default)
    {
        return dbContext.JobSources
            .AsNoTracking()
            .Where(source => ids.Contains(source.Id))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<JobSource>> GetByCompanyNameAsync(string companyName, CancellationToken cancellationToken)
    {
        var result = await dbContext.JobSources
            .AsNoTracking()
            .Where(source => source.CompanyName.Contains(companyName, StringComparison.OrdinalIgnoreCase))
            .ToListAsync(cancellationToken);
        return result;
    }
}
