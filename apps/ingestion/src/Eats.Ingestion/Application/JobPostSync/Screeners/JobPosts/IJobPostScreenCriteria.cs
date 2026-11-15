using Eats.Ingestion.Domain.JobPosts;

namespace Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;
public interface IJobPostScreenCriteria
{
    public string? Location { get; }
    public string Title { get; }

    public string DetailPath { get; }

}