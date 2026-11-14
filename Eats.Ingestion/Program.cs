using Eats.Ingestion.Application.Routes;
using Eats.Ingestion.HostedServices;
using Eats.Ingestion.Infrastructure.Configuration;
using Serilog;
using Serilog.Sinks.OpenTelemetry;
using Serilog.Events;
using Eats.Ingestion.Infrastructure.Logging;



var builder = WebApplication.CreateBuilder(args);

// Console presentation and OTLP export are independent Serilog sinks.
builder.Services.AddSerilog((services, logger) =>
{
    var levelName = builder.Configuration["Serilog:MinimumLevel:Default"] ?? "Information";
    if (!Enum.TryParse<LogEventLevel>(levelName, true, out var defaultLevel))
    {
        throw new InvalidOperationException($"Invalid Serilog minimum level: {levelName}");
    }

    logger.MinimumLevel.Is(defaultLevel);

    foreach (var overrideSection in builder.Configuration
        .GetSection("Serilog:MinimumLevel:Override").GetChildren())
    {
        if (!Enum.TryParse<LogEventLevel>(overrideSection.Value, true, out var overrideLevel))
        {
            throw new InvalidOperationException(
                $"Invalid Serilog minimum level override for {overrideSection.Key}");
        }

        logger.MinimumLevel.Override(overrideSection.Key, overrideLevel);
    }

    logger
        .Enrich.FromLogContext()
        .WriteTo.Console(new SingleLineConsoleFormatter());

    var endpoint = builder.Configuration["Telemetry:OtlpEndpoint"];
    if (!string.IsNullOrWhiteSpace(endpoint))
    {
        logger.WriteTo.OpenTelemetry(options =>
        {
            options.Endpoint = endpoint;
            options.Protocol = OtlpProtocol.HttpProtobuf;
            options.ResourceAttributes = new Dictionary<string, object>
            {
                ["service.name"] = "eats-ingestion",
                ["deployment.environment.name"] = builder.Environment.EnvironmentName
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