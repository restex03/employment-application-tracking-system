using Eats.Ingestion.Application.JobPostSync.Screeners.JobDetails;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;

namespace Eats.Ingestion.Application.JobPostSync;

public interface IJobScreenService
{
    bool IsSatisfiedBy(IJobPostScreenCriteria jobPost);

    bool IsSatisfiedBy(IJobDetailScreenCriteria jobDetail);
}
