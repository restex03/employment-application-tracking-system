using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Application.JobPostSync.Queue;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("JobPosts")
    ?? throw new InvalidOperationException("Connection string 'JobPosts' is not configured.");
builder.Services.AddDbContext<JobPostDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IJobPostRepository, JobPostRepository>()
    .AddScoped<IJobPostSyncQueue, JobPostSyncQueueRepository>()
    .AddScoped<IJobSourceRepository, JobSourceRepository>()
    .AddScoped<IJobPostSyncService, JobPostSyncService>()
    .AddScoped<IJobSourceService, IJobSourceService.Imp>()
    .AddScoped<IJobPostScreener, JobPostScreener>(sp => new JobPostScreener([
        new DetailPathScreener(),
        new LocationScreener(),
        new RolesScreener(),    
    ])
);
builder.Services.AddSingleton<IJobPostDiscoveryServiceFactory, IJobPostDiscoveryServiceFactory.Imp>();
builder.Services.AddHttpClient(nameof(WorkdayJobsGateway), client =>
{
    client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
    client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en-US");
});
builder.Services.AddHostedService<JobPostSyncQueueWorker>();
builder.Services.AddHostedService<JobPostSyncDailyScheduler>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<JobPostDbContext>();
    await dbContext.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
}

await SeedDefaultWorkdaySourcesIfEmpty(app);


app.MapGet("/jobSources/{id}", async ([FromServices] IJobSourceService svc, [FromRoute] Guid id) =>
{
    try
    {
        var result = await svc.GetByIdOrThrow(id);
        return Results.Ok(result);    
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});


app.MapGet("/jobSources", async (
    [FromServices] IJobSourceService svc,
    [FromQuery] string? companyName) =>
{
    try
    {
        if (!string.IsNullOrWhiteSpace(companyName))
        {
            var source = await svc.GetByCompanyName(companyName);
            return Results.Ok(source);
        }

        var sources = await svc.GetAll();
        return Results.Ok(sources);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
    
});



app.MapPost(
    "/ingestion/jobPosts/sync",
    async (
        [FromBody] JobPostSyncRequest req,
        [FromServices] IServiceScopeFactory scopeFactory,
         CancellationToken ct
    ) =>
{
    await using var scope = scopeFactory.CreateAsyncScope();
    var queue = scope.ServiceProvider.GetRequiredService<IJobPostSyncQueue>();
    var jobId = await queue.Enqueue(
        req.SourceIds,
        req.SearchText,
        ct);

    return new { Id = jobId };

});

app.Run();

static async Task SeedDefaultWorkdaySourcesIfEmpty(WebApplication app)
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

internal sealed class WorkdaySourceConfiguration
{
    public string? CompanyName { get; init; }
    public string? BaseUrl { get; init; }
}


internal sealed class JobPostSyncRequest
{
    public required Guid[]? SourceIds { get; init; }

    public required string SearchText { get; init; }
}