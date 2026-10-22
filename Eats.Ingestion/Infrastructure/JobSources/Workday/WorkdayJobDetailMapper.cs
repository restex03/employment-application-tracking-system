using System.Text.RegularExpressions;
using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;
using Ganss.Xss;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed partial class WorkdayJobDetailMapper
{
    private readonly HtmlSanitizer sanitizer = new();

    public WorkdayJobDetailMapper()
    {
        sanitizer.AllowedTags.Add("img");
        sanitizer.AllowedAttributes.Add("target");
        sanitizer.AllowedAttributes.Add("src");
        sanitizer.AllowedAttributes.Add("alt");
    }

    public JobPostDetailDiscovery Map(WorkdayJobDetailsApiResponse response)
    {
        var posting = response.JobPostingInfo;
        var locations = new List<JobPostLocation>();
        if (!string.IsNullOrWhiteSpace(posting.Location))
        {
            locations.Add(new JobPostLocation
            {
                City = posting.Location,
                Country = posting.Country?.Descriptor,
            });
        }

        locations.AddRange(
            (posting.AdditionalLocations ?? [])
                .Where(location => !string.IsNullOrWhiteSpace(location))
                .Select(location => new JobPostLocation { City = location }));

        var distinctLocations = locations
            .DistinctBy(location => $"{location.City ?? ""}|{location.State ?? ""}|{location.Country ?? ""}")
            .ToArray();
        var description = NormalizeHtml(sanitizer.Sanitize(posting.JobDescription ?? string.Empty));

        var detail = new JobPostDetail(
            Guid.NewGuid(),
            description,
            jobPostId: null,
            posting.TimeType,
            distinctLocations,
            remoteType: posting.RemoteType,
            fetchedAt: DateTime.UtcNow);

        return new JobPostDetailDiscovery(detail, posting.JobReqId, posting.Title ?? string.Empty, posting.RemoteType);
    }

    private static string NormalizeHtml(string html)
    {
        return HeadingRegex().Replace(
            html,
            match =>
            {
                var attributes = match.Groups[2].Value;
                var content = BoldTagRegex().Replace(match.Groups[3].Value, string.Empty);
                return $"<h5{attributes}>{content}</h5>";
            });
    }

    [GeneratedRegex(@"<(h[1-5])(\b[^>]*)>([\s\S]*?)</\1>", RegexOptions.IgnoreCase)]
    private static partial Regex HeadingRegex();

    [GeneratedRegex(@"</?(?:b|strong)\b[^>]*>", RegexOptions.IgnoreCase)]
    private static partial Regex BoldTagRegex();
}
