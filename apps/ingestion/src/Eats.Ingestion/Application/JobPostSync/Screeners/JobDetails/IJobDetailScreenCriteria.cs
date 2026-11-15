using Eats.Ingestion.Domain.JobPosts;
namespace Eats.Ingestion.Application.JobPostSync.Screeners.JobDetails;
public interface IJobDetailScreenCriteria
{
    public JobPostLocation[]? Locations { get; }
}