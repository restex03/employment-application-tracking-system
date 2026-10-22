using Eats.Ingestion.Application.JobPostSync.Queue;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;

public sealed class TaskQueueTypeConfiguration : IEntityTypeConfiguration<QueueTask>
{
    public void Configure(EntityTypeBuilder<QueueTask> builder)
    {
        var tableName = "QueueTasks";
        builder.ToTable(tableName);
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
            .HasDatabaseName($"IX_{tableName}_Status_CreatedAt");
    }
}
