using System.Text.RegularExpressions;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobDetails;
using Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;

namespace Eats.Ingestion.Application.JobPostSync;

public sealed class JobScreenService : IJobScreenService
{
    private readonly IJobPostScreener[] _jobPostScreeners = [];
    private readonly IJobDetailScreener[] _jobDetailScreeners = [];

    public JobScreenService(IJobPostScreener[] jobPostScreeners, IJobDetailScreener[] jobDetailScreeners)
    {
        _jobPostScreeners = jobPostScreeners;
        _jobDetailScreeners = jobDetailScreeners;
    }

    public bool IsSatisfiedBy(IJobPostScreenCriteria jobPost)
    {
        return _jobPostScreeners.All(x => x.ScreenJobPost(jobPost));
    }

    public bool IsSatisfiedBy(IJobDetailScreenCriteria jobDetail)
    {
        return _jobDetailScreeners.All(x => x.ScreenJobDetail(jobDetail));
    }
}
