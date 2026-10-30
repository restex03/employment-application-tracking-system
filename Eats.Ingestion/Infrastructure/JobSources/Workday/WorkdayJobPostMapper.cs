using System.Text.Json;
using System.Text.RegularExpressions;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed partial class WorkdayJobPostMapper(
    ILogger<WorkdayJobPostMapper> logger,
    IJobLinkBuilder jobLinkBuilder)
{
    public JobPostDiscoveryDto? Map(JobSource jobSource, WorkdayJobPosting posting)
    {
        if (string.IsNullOrWhiteSpace(posting.Title) || string.IsNullOrWhiteSpace(posting.ExternalPath))
        {
            logger.LogWarning(
                "Ignoring Workday posting with missing title or externalPath: {Posting}",
                JsonSerializer.Serialize(posting));
            return null;
        }

        var tail = posting.ExternalPath.Split('_').LastOrDefault();
        var match = tail is null ? null : RequisitionIdRegex().Match(tail);
        var requisitionId = match is { Success: true } ? match.Groups[1].Value : posting.ExternalPath;
        var jobLink = jobLinkBuilder.BuildJobLink(new Uri(jobSource.BrowserBaseUrl), posting.ExternalPath);
        return new JobPostDiscoveryDto(
            jobSource.Id,
            posting.Title,
            posting.ExternalPath,
            jobLink,
            requisitionId,
            posting.LocationsText,
            NormalizeDaysOld(posting.PostedOn),
            posting.RemoteType);
    }
    private static int? NormalizeDaysOld(string? postedOn)
    {
        if (postedOn is "Posted Today")
        {
            return 0;
        }

        if (postedOn is "Posted Yesterday")
        {
            return 1;
        }

        if (postedOn is not null && postedOn.Contains("30+ Days Ago", StringComparison.Ordinal))
        {
            return 30;
        }

        if (postedOn is not null)
        {
            var match = DaysAgoRegex().Match(postedOn);
            if (match.Success && int.TryParse(match.Groups[1].Value, out var days))
            {
                return days;
            }
        }

        return null;
    }

    [GeneratedRegex(@"^(JR-?\d+|R-?\d+|J\d+|P\d+|\d{2}WD\d+|\d+)(?:-\d+)?$", RegexOptions.IgnoreCase)]
    private static partial Regex RequisitionIdRegex();

    [GeneratedRegex(@"^Posted (\d+) Days Ago$")]
    private static partial Regex DaysAgoRegex();
}
