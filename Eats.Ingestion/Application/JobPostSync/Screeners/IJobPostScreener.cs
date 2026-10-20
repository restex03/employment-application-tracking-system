using Eats.Ingestion.Application.JobPostDiscovery;

namespace Eats.Ingestion.Application.JobPostSync;

public interface IJobPostScreener
{
    bool ScreenJobPost(IJobScreenCriteria jobPost);
}
