using System.Text.Json;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed partial class WorkdayJobPostMapper(
    ILogger<WorkdayJobPostMapper> logger,
    IJobLinkBuilder jobLinkBuilder,
    IWorkdayParser workdayParser)
{
    public JobPostDiscovery? Map(JobSource jobSource, WorkdayJobPosting posting)
    {
        if (string.IsNullOrWhiteSpace(posting.Title) || string.IsNullOrWhiteSpace(posting.ExternalPath))
        {
            logger.LogWarning(
                "Ignoring Workday posting with missing title or externalPath: {Posting}",
                JsonSerializer.Serialize(posting));
            return null;
        }

        var requisitionId = workdayParser.ParseRequisitionId(posting.ExternalPath);
        var jobLink = jobLinkBuilder.BuildJobLink(new Uri(jobSource.BrowserBaseUrl), posting.ExternalPath);
        return new JobPostDiscovery(
            jobSource.Id,
            posting.Title,
            posting.ExternalPath,
            jobLink,
            requisitionId,
            workdayParser.ParseLocations(posting.LocationsText),
            workdayParser.MapToPostedDate(posting.PostedOn),
            posting.RemoteType);
    }
    

}
