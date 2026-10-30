using System.Text.Json;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Configuration;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Microsoft.EntityFrameworkCore;

public static class InitializeDatabase
{

    public static async Task RunDatabaseMigrations(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<EatsIngestionDbContext>();
        await dbContext.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
    }
    
    public static async Task SeedDefaultWorkdaySourcesIfEmpty(this WebApplication app)
    {
        await using var scope = app.Services.CreateAsyncScope();
        var sourceRepository = scope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
        var sources = await sourceRepository.GetAllAsync(app.Lifetime.ApplicationStopping);
        if (sources.Any())
        {
            return;
        }

        var configuredPath = app.Configuration["WORKDAY_SOURCES"]
            ?? app.Configuration["Workday:SourcesPath"]
            ?? throw new InvalidOperationException(
                "Workday source file path is not configured. Set WORKDAY_SOURCES or Workday:SourcesPath.");
        var sourcePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.GetFullPath(configuredPath, app.Environment.ContentRootPath);
        var json = await File.ReadAllTextAsync(sourcePath, app.Lifetime.ApplicationStopping);
        var configuredSources = JsonSerializer.Deserialize<List<WorkdaySourceConfiguration>>(
            json,
            new JsonSerializerOptions(JsonSerializerDefaults.Web))
            ?? throw new InvalidOperationException($"Workday source file '{sourcePath}' must contain a JSON array.");

        var jobSources = configuredSources.Select(source =>
        {
            if (string.IsNullOrWhiteSpace(source.CompanyName) || string.IsNullOrWhiteSpace(source.BaseUrl))
            {
                throw new InvalidOperationException(
                    $"Workday source in '{sourcePath}' is missing its companyName or baseUrl.");
            }

            var browserBaseUrl = System.Text.RegularExpressions.Regex.Replace(
                source.BaseUrl,
                @"/wday/cxs/[^/]+",
                "/en-US");
            return new JobSource(Guid.NewGuid(), source.CompanyName, source.BaseUrl, browserBaseUrl);
        }).ToArray();

        await sourceRepository.AddManyAsync(jobSources, app.Lifetime.ApplicationStopping);
        app.Logger.LogInformation("Seeded {SourceCount} Workday sources from {SourcePath}", jobSources.Length, sourcePath);
    }
}