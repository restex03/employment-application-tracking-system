using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Application.JobPostDiscovery;

public interface IJobPostDiscoveryServiceFactory
{
    IJobPostDiscoveryService Create(JobSource source);
}
