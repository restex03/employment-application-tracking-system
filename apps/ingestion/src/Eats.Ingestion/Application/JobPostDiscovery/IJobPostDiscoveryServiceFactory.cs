using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public interface IJobPostDiscoveryServiceFactory
{
    IJobPostDiscoveryService Create(JobSource source);


    public sealed class Imp(
    IHttpClientFactory httpClientFactory,
    ILoggerFactory loggerFactory,
    IJobLinkBuilder jobLinkBuilder,
    IWorkdayParser workdayParser) : IJobPostDiscoveryServiceFactory
{
    public IJobPostDiscoveryService Create(JobSource source)
    {
        return new WorkdayJobDiscoveryService(
            source,
            new WorkdayJobsGateway(
                httpClientFactory.CreateClient(nameof(WorkdayJobsGateway)),
                loggerFactory.CreateLogger<WorkdayJobsGateway>()),
            new WorkdayJobPostMapper(
                loggerFactory.CreateLogger<WorkdayJobPostMapper>(),
                jobLinkBuilder,
                workdayParser),
            new WorkdayJobDetailMapper(),
            loggerFactory.CreateLogger<WorkdayJobDiscoveryService>());
    }
}
}
