using Eats.Ingestion.Application.Routes;
using Eats.Ingestion.HostedServices;
using Eats.Ingestion.Infrastructure.Configuration;



var builder = WebApplication.CreateBuilder(args);

// Application Services
builder.Services.AddApplicationServices(builder.Configuration);

// Infrastructure Services
builder.Services.AddInfrastructureServices(builder.Configuration);

// Hosted Services
builder.Services.AddHostedService<JobSynchronizer>();
builder.Services.AddHostedService<JobSynchronizerTaskScheduler>();
builder.Services.AddHostedService<JobDetailHydrator>();


var app = builder.Build();


// Migrations
await app.RunDatabaseMigrations();

// Seed Database
await app.SeedDefaultWorkdaySourcesIfEmpty();


// Map Endpoints

app.MapGroup("/api/ingestion/jobPosts")
    .MapJobPostApi()
    .WithTags("JobPosts");

app.MapGroup("/api/ingestion/jobSources")
    .MapJobSourceApi()
    .WithTags("JobSources");

app.MapGroup("/api/ingestion/discovery")
    .MapDiscoveryApi()
    .WithTags("Discovery");

app.MapGroup("/api/ingestion/queueTasks")
    .MapTaskQueueApi()
    .WithTags("QueueTasks");

app.MapGroup("/health")
    .MapHealthCheckEndpoints()
    .WithTags("HealthChecks");


app.Run();