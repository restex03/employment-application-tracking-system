using Eats.Ingestion.Application.JobPostSync.Queue;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Microsoft.EntityFrameworkCore;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class EatsIngestionDbContext(DbContextOptions<EatsIngestionDbContext> options) : DbContext(options)
{
    public DbSet<JobPost> JobPosts => Set<JobPost>();
    public DbSet<JobPostDetail> JobPostDetails => Set<JobPostDetail>();
    public DbSet<JobSource> JobSources => Set<JobSource>();
    public DbSet<QueueTask> QueueTasks => Set<QueueTask>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(EatsIngestionDbContext).Assembly);
    }
}
