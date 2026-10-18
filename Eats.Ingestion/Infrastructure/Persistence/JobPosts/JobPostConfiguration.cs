using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostConfiguration : IEntityTypeConfiguration<JobPost>
{
    public void Configure(EntityTypeBuilder<JobPost> builder)
    {
        builder.ToTable(nameof(JobPost));
        builder.HasKey(jobPost => jobPost.Id);
        builder.Property(jobPost => jobPost.Id)
            .HasColumnName(nameof(JobPost.Id))
            .IsRequired();
        builder.Property(jobPost => jobPost.SourceId)
            .HasColumnName(nameof(JobPost.SourceId))
            .HasColumnType("TEXT")
            .IsRequired();
        builder.Property(jobPost => jobPost.RequisitionId)
            .HasColumnName(nameof(JobPost.RequisitionId))
            .HasColumnType("TEXT");
        builder.Property(jobPost => jobPost.Title)
            .HasColumnName(nameof(JobPost.Title))
            .HasColumnType("TEXT")
            .IsRequired();
        builder.Property(jobPost => jobPost.DetailPath)
            .HasColumnName(nameof(JobPost.DetailPath))
            .HasColumnType("TEXT")
            .IsRequired();
        builder.Property(jobPost => jobPost.Location)
            .HasColumnName(nameof(JobPost.Location))
            .HasColumnType("TEXT");
        builder.Property(jobPost => jobPost.DaysOld)
            .HasColumnName(nameof(JobPost.DaysOld))
            .HasColumnType("INTEGER");
        builder.Property(jobPost => jobPost.RemoteType)
            .HasColumnName(nameof(JobPost.RemoteType))
            .HasColumnType("TEXT");
        builder.Property(jobPost => jobPost.Dismissed)
            .HasColumnName(nameof(JobPost.Dismissed))
            .HasColumnType("BOOLEAN")
            .HasDefaultValue(false)
            .IsRequired();
        builder.Property(jobPost => jobPost.CreatedAt)
            .HasColumnName(nameof(JobPost.CreatedAt))
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasIndex(jobPost => new { jobPost.SourceId, jobPost.DetailPath })
            .IsUnique()
            .HasDatabaseName("UX_JobPost_SourceId_DetailPath");
        builder.HasOne<JobSource>()
            .WithMany()
            .HasForeignKey(jobPost => jobPost.SourceId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(jobPost => jobPost.Detail)
            .WithOne(detail => detail.JobPost)
            .HasForeignKey<JobPostDetail>(detail => detail.JobPostId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
