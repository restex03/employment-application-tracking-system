using Eats.Ingestion.Domain.JobPosts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostDetailConfiguration : IEntityTypeConfiguration<JobPostDetail>
{
    public void Configure(EntityTypeBuilder<JobPostDetail> builder)
    {
        builder.ToTable(nameof(JobPostDetail));
        builder.HasKey(detail => detail.Id);
        builder.Property(detail => detail.Id)
            .HasColumnName(nameof(JobPostDetail.Id))
            .IsRequired();
        builder.Property(detail => detail.JobPostId)
            .HasColumnName(nameof(JobPostDetail.JobPostId))
            .IsRequired();
        builder.Property(detail => detail.Description)
            .HasColumnName(nameof(JobPostDetail.Description))
            .HasColumnType("TEXT")
            .IsRequired();
        builder.Property(detail => detail.EmploymentType)
            .HasColumnName(nameof(JobPostDetail.EmploymentType))
            .HasColumnType("TEXT");
        var locations = builder.Property(detail => detail.Locations)
            .HasColumnName(nameof(JobPostDetail.Locations))
            .HasColumnType("TEXT")
            .HasConversion(JsonArrayValueConverter<JobPostLocation>.Converter);
        locations.Metadata.SetValueComparer(JsonArrayValueConverter<JobPostLocation>.Comparer);
        builder.Property(detail => detail.ValidThrough)
            .HasColumnName(nameof(JobPostDetail.ValidThrough))
            .HasColumnType("TEXT");
        builder.Property(detail => detail.RemoteType)
            .HasColumnName(nameof(JobPostDetail.RemoteType))
            .HasColumnType("TEXT");
        var applicantLocations = builder.Property(detail => detail.ApplicantLocations)
            .HasColumnName(nameof(JobPostDetail.ApplicantLocations))
            .HasColumnType("TEXT")
            .HasConversion(JsonArrayValueConverter<string>.Converter);
        applicantLocations.Metadata.SetValueComparer(JsonArrayValueConverter<string>.Comparer);
        builder.Property(detail => detail.FetchedAt)
            .HasColumnName(nameof(JobPostDetail.FetchedAt))
            .HasColumnType("timestamp with time zone")
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasIndex(detail => detail.JobPostId)
            .IsUnique()
            .HasDatabaseName("IX_JobPostDetail_JobPostId");
    }
}
