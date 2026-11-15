using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobDetails;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;
using Microsoft.FeatureManagement;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddFeatureManagement();
        services.AddScoped<ITaskQueueService, ITaskQueueService.Imp>();
        services.AddScoped<IJobSourceService, IJobSourceService.Imp>();
        services.AddScoped<IJobPostSyncService, IJobPostSyncService.Imp>();
        services.AddScoped<IJobPostService, IJobPostService.Imp>();
        services.AddScoped<IJobScreenService, JobScreenService>(sp => new JobScreenService([
            new IJobPostScreener.LocationScreener(),
            new IJobPostScreener.UriPathScreener(),
            new IJobPostScreener.TitleScreener(),    
        ], [
            new IJobDetailScreener.LocationScreener()
        ]));

        services.AddSingleton<IJobPostDiscoveryServiceFactory, IJobPostDiscoveryServiceFactory.Imp>();

        return services;
    }
}