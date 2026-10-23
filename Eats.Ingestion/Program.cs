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
using Eats.Ingestion.Application.JobPosts.Models;

var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("JobPosts")
    ?? throw new InvalidOperationException("Connection string 'JobPosts' is not configured.");
builder.Services.AddDbContext<EatsIngestionDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddScoped<IJobPostRepository, JobPostRepository>()
    .AddScoped<ITaskQueue, ITaskQueue.Imp>()
    .AddScoped<IJobSourceRepository, JobSourceRepository>()
    .AddScoped<ITaskQueueService, ITaskQueueService.Imp>()
    .AddScoped<IJobSourceService, IJobSourceService.Imp>()
    .AddScoped<IJobPostSyncService, IJobPostSyncService.Imp>()
    .AddScoped<IJobPostService, IJobPostService.Imp>()
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
builder.Services.AddHostedService<TaskQueueWorker>();
builder.Services.AddHostedService<JobPostSyncDailyScheduler>();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<EatsIngestionDbContext>();
    await dbContext.Database.MigrateAsync(app.Lifetime.ApplicationStopping);
}

await SeedDefaultWorkdaySourcesIfEmpty(app);


app.MapGet("/ingestion/jobSources/{id}", async ([FromServices] IJobSourceService svc, [FromRoute] Guid id) =>
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


app.MapGet("/ingestion/jobSources", async (
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

app.MapGet("/ingestion/queueTasks/{id}", async ([FromServices] ITaskQueueService svc, [FromRoute] Guid id) =>
{
    try
    {
        var result = await svc.GetByIdOrThrowAsync(id);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/ingestion/queueTasks", async ([FromServices] ITaskQueueService svc, [FromQuery] bool active = false) =>
{
    try
    {
        var result = active ? await svc.GetAllActiveAsync() : await svc.GetAllAsync();
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost(
    "/ingestion/queueTasks/sync",
    async (
        [FromBody] JobPostSyncRequest req,
        [FromServices] ITaskQueueService service,
         CancellationToken ct
    ) =>
{
    var jobId = await service.AddAsync(new JobPostSyncTask
    {
        SourceIds = req.SourceIds ?? [],
        SearchText = req.SearchText
    }, ct);

    return new { Id = jobId };
    

});

app.MapPost("/ingestion/discovery/jobPosts", async ([FromBody] JobPostDetailDiscoveryRequest req, [FromServices] IServiceScopeFactory scopeFactory, CancellationToken ct) =>
{
    try
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var svcFactory = scope.ServiceProvider.GetRequiredService<IJobPostDiscoveryServiceFactory>();
        var jobSourceRepo = scope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
        var jobSource = await jobSourceRepo.GetByIdOrThrowAsync(req.JobSourceId, ct);
        var svc = svcFactory.Create(jobSource);
        var result = await svc.FetchDetail(req.DetailPath, ct);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/ingestion/discovery/jobPostDetails", async ([FromBody] JobPostDetailDiscoveryRequest req, [FromServices] IServiceScopeFactory scopeFactory, CancellationToken ct) =>
{
    try
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var svcFactory = scope.ServiceProvider.GetRequiredService<IJobPostDiscoveryServiceFactory>();
        var jobSourceRepo = scope.ServiceProvider.GetRequiredService<IJobSourceRepository>();
        var jobSource = await jobSourceRepo.GetByIdOrThrowAsync(req.JobSourceId, ct);
        var svc = svcFactory.Create(jobSource);
        var result = await svc.FetchDetail(req.DetailPath, ct);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/ingestion/jobPosts/{jobPostId}", async ([FromRoute] Guid jobPostId, [FromServices] IJobPostService jobPostService, CancellationToken ct) =>
{
    try
    {
        var result = await jobPostService.GetByIdOrThrowAsync(jobPostId, ct);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/ingestion/jobPosts", async (
    [FromServices] IJobPostService jobPostService, 
    CancellationToken ct, 
    [AsParameters] JobPostQuery queryParams) =>
{
    try
    {
        var result = await jobPostService.ListAsync(queryParams, ct);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
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

internal sealed class JobPostDiscoveryRequest
{
    public required Guid JobSourceId { get; init; }
    public required string SearchText { get; init; }
}

internal sealed class JobPostDetailDiscoveryRequest
{
    public required string DetailPath { get; init; }
    public required Guid JobSourceId { get; init; }
}