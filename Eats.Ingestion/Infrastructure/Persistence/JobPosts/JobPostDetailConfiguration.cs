using Eats.Ingestion.Domain.JobPosts;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostDetailConfiguration : IEntityTypeConfiguration<JobPostDetail>
{
    public void Configure(EntityTypeBuilder<JobPostDetail> builder)
    {
        var tableName = "JobPostDetails";
        builder.ToTable(tableName);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .IsRequired();
        builder.Property(x => x.JobPostId)
            .IsRequired();
        builder.Property(x => x.Description)
            .IsRequired();
        builder.Property(x => x.EmploymentType);
        var locations = builder.Property(x => x.Locations)
            .HasConversion(JsonArrayValueConverter<JobPostLocation>.Converter);
        locations.Metadata.SetValueComparer(JsonArrayValueConverter<JobPostLocation>.Comparer);
        builder.Property(x => x.ValidThrough);
        builder.Property(x => x.RemoteType);
        var applicantLocations = builder.Property(x => x.ApplicantLocations)
            .HasConversion(JsonArrayValueConverter<string>.Converter);
        applicantLocations.Metadata.SetValueComparer(JsonArrayValueConverter<string>.Comparer);
        builder.Property(x => x.FetchedAt)
            .HasDefaultValueSql("CURRENT_TIMESTAMP")
            .IsRequired();

        builder.HasIndex(x => x.JobPostId)
            .IsUnique()
            .HasDatabaseName($"IX_{tableName}_JobPostId");
    }
}
