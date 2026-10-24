using System.Net.Http.Json;
using System.Text.Json;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class WorkdayJobsGateway(HttpClient httpClient, ILogger<WorkdayJobsGateway> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<WorkdayJobsApiResponse> Search(
        Uri baseUri,
        int limit,
        int offset,
        string? searchText,
        CancellationToken cancellationToken)
    {
        var url = new Uri(baseUri, "jobs");
        logger.LogTrace("Fetching Workday jobs from {Url}", url);
        var requestBody = new
        {
            appliedFacets = new Dictionary<string, string[]>(),
            limit,
            offset,
            searchText = searchText ?? string.Empty,
        };
        using var response = await httpClient.PostAsJsonAsync(
            url, requestBody, JsonOptions, cancellationToken);

        return await DeserializeResponse<WorkdayJobsApiResponse>(
            response, cancellationToken);
    }
    public async Task<WorkdayJobDetailsApiResponse> GetDetail(
        Uri baseUri,
        string detailPath,
        CancellationToken cancellationToken)
    {
        var path = detailPath.StartsWith("/", StringComparison.Ordinal) ? detailPath[1..] : detailPath;
        var url = new Uri(baseUri, path);
        logger.LogTrace("Fetching Workday job detail from {Url}", url);
        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Accept.ParseAdd("application/json");
        request.Headers.AcceptLanguage.ParseAdd("en-US");
        
        
        using var response = await httpClient.SendAsync(
            request, cancellationToken);

        return await DeserializeResponse<WorkdayJobDetailsApiResponse>(
            response, cancellationToken);
    }


    private static async Task<T> DeserializeResponse<T>(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var content = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"Workday API returned HTTP {(int)response.StatusCode} " +
                $"{response.ReasonPhrase}: {content}",
                null,
                response.StatusCode);
        }

        return JsonSerializer.Deserialize<T>(content, JsonOptions)
            ?? throw new InvalidOperationException(
                $"Workday API returned an empty response: {content}");
    }

}
