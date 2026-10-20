using Eats.Ingestion.Application.JobPostDiscovery;

public interface IScreener
{
    
    public bool IsSatisfiedBy(IJobScreenCriteria value);
}