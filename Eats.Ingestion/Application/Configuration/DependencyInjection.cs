using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
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
        services.AddScoped<IJobPostScreener, JobPostScreener>(sp => new JobPostScreener([
            new DetailPathScreener(),
            new LocationScreener(),
            new RolesScreener(),    
        ]));

        services.AddSingleton<IJobPostDiscoveryServiceFactory, IJobPostDiscoveryServiceFactory.Imp>();

        return services;
    }
}