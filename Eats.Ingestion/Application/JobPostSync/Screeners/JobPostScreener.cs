using System.Text.RegularExpressions;
using Eats.Ingestion.Application.JobPostDiscovery;

namespace Eats.Ingestion.Application.JobPostSync;

public sealed class JobPostScreener : IJobPostScreener
{
    private readonly IScreener[] _screeners = [];

    public JobPostScreener(IScreener[] screeners)
    {
        _screeners = screeners;
    }

    public bool ScreenJobPost(IJobScreenCriteria jobPost)
    {
        return _screeners.All(x => x.IsSatisfiedBy(jobPost));
    }
}
