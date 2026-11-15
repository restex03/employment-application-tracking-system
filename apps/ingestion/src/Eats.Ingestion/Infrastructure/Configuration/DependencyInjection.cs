using System.Net;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPostSyncQueue;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Http.Resilience;
using Polly;

namespace Eats.Ingestion.Infrastructure.Configuration;
public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");
        services.AddDbContext<EatsIngestionDbContext>(options => options.UseNpgsql(connectionString));
        services.AddScoped<IJobPostRepository, JobPostRepository>();
        services.AddScoped<IJobSourceRepository, JobSourceRepository>();
                services.AddScoped<ITaskQueue, ITaskQueue.Imp>();
        services.AddSingleton<IJobLinkBuilder, WorkdayJobLinkBuilder>();

        
        services.AddHealthChecks()
            .AddDbContextCheck<EatsIngestionDbContext>(
                name: "postgresql",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]
            );
        
        services.AddSingleton<IWorkdayParser, IWorkdayParser.Imp>();
        services.AddWorkdayHttpClientWithRetries();
        return services;
    }


    private static IServiceCollection AddWorkdayHttpClientWithRetries(this IServiceCollection services)
    {
        services.AddHttpClient(nameof(WorkdayJobsGateway), client =>
        {
            client.DefaultRequestHeaders.Accept.ParseAdd("application/json");
            client.DefaultRequestHeaders.AcceptLanguage.ParseAdd("en-US");
        })
        .AddResilienceHandler("workday-retry", (builder, context) =>
        {
            var logger = context.ServiceProvider
                .GetRequiredService<ILogger<WorkdayJobsGateway>>();

            builder.AddRetry(new HttpRetryStrategyOptions
            {
                MaxRetryAttempts = 3,
                Delay = TimeSpan.FromSeconds(1),
                MaxDelay = TimeSpan.FromSeconds(10),
                BackoffType = DelayBackoffType.Exponential,
                UseJitter = true,
                ShouldRetryAfterHeader = true,
                ShouldHandle = args =>
                {
                    if (args.Outcome.Exception is HttpRequestException)
                        return ValueTask.FromResult(true);

                    if (args.Outcome.Result is { } response)
                    {
                        var retry = response.StatusCode is
                            HttpStatusCode.TooManyRequests or
                            HttpStatusCode.RequestTimeout or
                            HttpStatusCode.BadGateway or
                            HttpStatusCode.ServiceUnavailable or
                            HttpStatusCode.GatewayTimeout;

                        return ValueTask.FromResult(retry);
                    }

                    return ValueTask.FromResult(false);
                },
                OnRetry = args =>
                {
                    logger.LogWarning(
                        "Retrying Workday request. Attempt: {Attempt}, Delay: {Delay}",
                        args.AttemptNumber + 1,
                        args.RetryDelay);

                    return default;
                }
            });
        });
        return services;
    }

}



internal sealed class WorkdaySourceConfiguration
{
    public string? CompanyName { get; init; }
    public string? BaseUrl { get; init; }
}
