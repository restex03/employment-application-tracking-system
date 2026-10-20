using Eats.Ingestion.Application.JobPostSync.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public sealed class JobPostSyncQueueJobConfiguration : IEntityTypeConfiguration<JobPostSyncQueueJob>
{
    public void Configure(EntityTypeBuilder<JobPostSyncQueueJob> builder)
    {
        builder.ToTable(nameof(JobPostSyncQueueJob));
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .IsRequired();
        builder.Property(x => x.SourceIds)
            .IsRequired();
        builder.Property(x => x.SearchText);
        builder.Property(x => x.Status)
            .HasConversion<int>()
            .IsRequired();
        builder.Property(x => x.Error);
        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();
        builder.HasIndex(x => new { x.Status, x.CreatedAt })
            .HasDatabaseName("IX_JobPostSyncQueueJob_Status_CreatedAt");
    }
}
