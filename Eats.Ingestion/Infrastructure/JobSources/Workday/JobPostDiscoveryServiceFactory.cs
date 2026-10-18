using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class JobPostDiscoveryServiceFactory(
    IHttpClientFactory httpClientFactory,
    ILoggerFactory loggerFactory) : IJobPostDiscoveryServiceFactory
{
    public IJobPostDiscoveryService Create(JobSource source)
    {
        return new WorkdayJobDiscoveryService(
            source,
            new WorkdayJobsGateway(
                httpClientFactory.CreateClient(nameof(WorkdayJobsGateway)),
                loggerFactory.CreateLogger<WorkdayJobsGateway>()),
            new WorkdayJobPostMapper(loggerFactory.CreateLogger<WorkdayJobPostMapper>()),
            new WorkdayJobDetailMapper(),
            loggerFactory.CreateLogger<WorkdayJobDiscoveryService>());
    }
}
