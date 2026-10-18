using Eats.Ingestion.Application.JobPostSync.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public sealed class JobPostSyncQueueJobConfiguration : IEntityTypeConfiguration<JobPostSyncQueueJob>
{
    public void Configure(EntityTypeBuilder<JobPostSyncQueueJob> builder)
    {
        builder.ToTable(nameof(JobPostSyncQueueJob));
        builder.HasKey(job => job.Id);
        builder.Property(job => job.Id)
            .HasColumnName(nameof(JobPostSyncQueueJob.Id))
            .IsRequired();
        builder.Property(job => job.SourceIds)
            .HasColumnName(nameof(JobPostSyncQueueJob.SourceIds))
            .HasColumnType("text[]")
            .IsRequired();
        builder.Property(job => job.SearchText)
            .HasColumnName(nameof(JobPostSyncQueueJob.SearchText))
            .HasColumnType("text");
        builder.Property(job => job.Status)
            .HasColumnName(nameof(JobPostSyncQueueJob.Status))
            .HasConversion<int>()
            .IsRequired();
        builder.Property(job => job.Error)
            .HasColumnName(nameof(JobPostSyncQueueJob.Error))
            .HasColumnType("text");
        builder.Property(job => job.CreatedAt)
            .HasColumnName(nameof(JobPostSyncQueueJob.CreatedAt))
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();
        builder.HasIndex(job => new { job.Status, job.CreatedAt })
            .HasDatabaseName("IX_JobPostSyncQueueJob_Status_CreatedAt");
    }
}
