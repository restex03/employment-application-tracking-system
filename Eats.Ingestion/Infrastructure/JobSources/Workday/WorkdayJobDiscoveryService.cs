using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class WorkdayJobDiscoveryService(
    JobSource jobSource,
    WorkdayJobsGateway gateway,
    WorkdayJobPostMapper jobPostMapper,
    WorkdayJobDetailMapper jobDetailMapper,
    ILogger<WorkdayJobDiscoveryService> logger) : IJobPostDiscoveryService
{
    private const int PageSize = 20;

    public async Task<IReadOnlyList<JobPostDiscovery>> FetchList(
        string? searchText = null,
        CancellationToken cancellationToken = default)
    {
        var baseUri = GetBaseUri(jobSource.BaseUrl);
        var discovered = new Dictionary<string, JobPostDiscovery>(StringComparer.Ordinal);
        var offset = 0;
        int? total = null;

        do
        {
            var response = await gateway.Search(baseUri, PageSize, offset, searchText, cancellationToken);
            total ??= response.Total;
            foreach (var posting in response.JobPostings)
            {
                var mapped = jobPostMapper.Map(jobSource, posting);
                if (mapped is not null)
                {
                    discovered[mapped.DetailPath] = mapped;
                }
            }

            logger.LogTrace(
                "Fetched {Count} Workday job postings for {Company} at offset {Offset}",
                response.JobPostings.Count,
                jobSource.CompanyName,
                offset);
            offset += PageSize;
        } while (offset < total);

        return discovered.Values.ToArray();
    }

    public async Task<JobPostDetailDiscovery> FetchDetail(
            string detailPath,
        CancellationToken cancellationToken = default)
    {
        var response = await gateway.GetDetail(GetBaseUri(jobSource.BaseUrl), detailPath, cancellationToken);
        return jobDetailMapper.Map(response);
    }

    private static Uri GetBaseUri(string baseUrl)
    {
        return new Uri(baseUrl.EndsWith("/", StringComparison.Ordinal) ? baseUrl : $"{baseUrl}/");
    }
}
