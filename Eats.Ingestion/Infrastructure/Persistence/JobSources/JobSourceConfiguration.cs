using Eats.Ingestion.Domain.JobSources;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public sealed class JobSourceConfiguration : IEntityTypeConfiguration<JobSource>
{
    public void Configure(EntityTypeBuilder<JobSource> builder)
    {
        builder.ToTable(nameof(JobSource));
        builder.HasKey(source => source.Id);
        builder.Property(source => source.Id)
            .HasColumnName(nameof(JobSource.Id))
            .IsRequired();
        builder.Property(source => source.CompanyName)
            .HasColumnName(nameof(JobSource.CompanyName))
            .IsRequired();
        builder.Property(source => source.BaseUrl)
            .HasColumnName(nameof(JobSource.BaseUrl))
            .IsRequired();
        builder.Property(source => source.BrowserBaseUrl)
            .HasColumnName(nameof(JobSource.BrowserBaseUrl))
            .IsRequired();

        builder.HasIndex(source => source.CompanyName).IsUnique();
        builder.HasIndex(source => source.BaseUrl).IsUnique();
        builder.HasIndex(source => source.BrowserBaseUrl).IsUnique();
    }
}
