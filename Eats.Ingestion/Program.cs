using Eats.Ingestion.Application.Routes;
using Eats.Ingestion.HostedServices;
using Eats.Ingestion.Infrastructure.Configuration;
using Serilog;
using Serilog.Sinks.OpenTelemetry;



var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, logger) =>
{
    logger
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
        .Enrich.FromLogContext()
        .WriteTo.Console(outputTemplate: "{Timestamp:yyyy-MM-ddTHH:mm:ss.fffzzz} " +
                "[{Level:u3}] " +
                "[{SourceContext}] " +
                "{Message:lj} {Properties:j}{NewLine}{Exception}");
    var endpoint = builder.Configuration["Telemetry:OtlpEndpoint"];

    if (!string.IsNullOrWhiteSpace(endpoint))
    {
        logger.WriteTo.OpenTelemetry(options =>
        {
            options.Endpoint = endpoint;
            options.Protocol = OtlpProtocol.HttpProtobuf;

            options.ResourceAttributes =
                new Dictionary<string, object>
                {
                    ["service.name"] = "eats-ingestion",
                    ["deployment.environment.name"] =
                        builder.Environment.EnvironmentName
                };
        });
    }
}); 

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