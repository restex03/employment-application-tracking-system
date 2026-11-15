using Eats.Ingestion.Domain.JobSources;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Eats.Ingestion.Infrastructure.Persistence.JobSources;

public sealed class JobSourceConfiguration : IEntityTypeConfiguration<JobSource>
{
    public void Configure(EntityTypeBuilder<JobSource> builder)
    {
        var tableName = "JobSources";
        builder.ToTable(tableName);
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Id)
            .IsRequired()
            .ValueGeneratedNever();;
        builder.Property(x => x.CompanyName)
            .IsRequired();
        builder.Property(x => x.BaseUrl)
            .IsRequired();
        builder.Property(x => x.BrowserBaseUrl)
            .IsRequired();

        builder.HasIndex(x => x.CompanyName).IsUnique();
        builder.HasIndex(x => x.BaseUrl).IsUnique();
        builder.HasIndex(x => x.BrowserBaseUrl).IsUnique();
    }
}
