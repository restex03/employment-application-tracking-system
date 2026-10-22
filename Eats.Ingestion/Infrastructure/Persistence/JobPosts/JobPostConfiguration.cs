using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostConfiguration : IEntityTypeConfiguration<JobPost>
{
    public void Configure(EntityTypeBuilder<JobPost> builder)
    {
        var tableName = "JobPosts";
        builder.ToTable(tableName);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();
        builder.Property(x => x.SourceId)
            .IsRequired();
        builder.Property(x => x.RequisitionId);
        builder.Property(x => x.Title)
            .IsRequired();
        builder.Property(x => x.DetailPath)
            .IsRequired();
        builder.Property(x => x.Location);
        builder.Property(x => x.DaysOld);
        builder.Property(x => x.RemoteType);
        builder.Property(x => x.Dismissed)
            .HasDefaultValue(false)
            .IsRequired();
        builder.Property(x => x.CreatedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasIndex(x => new { x.SourceId, x.DetailPath })
            .IsUnique()
            .HasDatabaseName($"UX_{tableName}_SourceId_DetailPath");
        builder.HasOne<JobSource>()
            .WithMany()
            .HasForeignKey(x => x.SourceId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Detail)
            .WithOne(x => x.JobPost)
            .HasForeignKey<JobPostDetail>(x => x.JobPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
