namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public interface IJobLinkBuilder
{
    Uri BuildJobLink(Uri detailBaseUrl, string detailPath);
}
