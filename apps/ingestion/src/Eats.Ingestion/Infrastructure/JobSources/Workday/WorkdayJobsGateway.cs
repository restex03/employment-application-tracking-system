using System.Diagnostics;
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
        logger.LogTrace(
            "Fetching Workday jobs from {RequestHost}{RequestPath} at offset {Offset}",
            url.Host, url.AbsolutePath, offset);

        var requestBody = new
        {
            appliedFacets = new Dictionary<string, string[]>(),
            limit,
            offset,
            searchText = searchText ?? string.Empty,
        };

        var stopwatch = Stopwatch.StartNew();
        using var response = await httpClient.PostAsJsonAsync(
            url, requestBody, JsonOptions, cancellationToken);

        return await DeserializeResponse<WorkdayJobsApiResponse>(
            response, stopwatch.ElapsedMilliseconds, cancellationToken);
    }

    public async Task<WorkdayJobDetailsApiResponse> GetDetail(
        Uri baseUri,
        string detailPath,
        CancellationToken cancellationToken)
    {
        var path = detailPath.StartsWith("/", StringComparison.Ordinal)
            ? detailPath[1..]
            : detailPath;
        var url = new Uri(baseUri, path);

        logger.LogTrace(
            "Fetching Workday job detail from {RequestHost}{RequestPath}",
            url.Host, url.AbsolutePath);

        using var request = new HttpRequestMessage(HttpMethod.Get, url);
        request.Headers.Accept.ParseAdd("application/json");
        request.Headers.AcceptLanguage.ParseAdd("en-US");

        var stopwatch = Stopwatch.StartNew();
        using var response = await httpClient.SendAsync(request, cancellationToken);

        return await DeserializeResponse<WorkdayJobDetailsApiResponse>(
            response, stopwatch.ElapsedMilliseconds, cancellationToken);
    }

    private async Task<T> DeserializeResponse<T>(
        HttpResponseMessage response,
        long durationMs,
        CancellationToken cancellationToken)
    {
        // RequestMessage is the final URL when redirects occurred. Never log its query string.
        var requestUri = response.RequestMessage?.RequestUri;
        var requestHost = requestUri?.Host ?? "(unknown)";
        var requestPath = requestUri?.AbsolutePath ?? "(unknown)";
        var statusCode = (int)response.StatusCode;
        var contentType = response.Content.Headers.ContentType?.MediaType ?? "(none)";

        if (!response.IsSuccessStatusCode)
        {
            logger.LogWarning(
                "Workday API returned HTTP {HttpStatusCode} from {RequestHost}{RequestPath}, content type {ContentType}, elapsed {DurationMs}ms",
                statusCode, requestHost, requestPath, contentType, durationMs);

            // Do not include HTML, full response bodies, or a URL containing query parameters.
            throw new HttpRequestException(
                $"Workday API returned HTTP {statusCode} {response.ReasonPhrase} from {requestHost}{requestPath}",
                null,
                response.StatusCode);
        }

        var isJson = contentType.Equals("application/json", StringComparison.OrdinalIgnoreCase) ||
            contentType.EndsWith("+json", StringComparison.OrdinalIgnoreCase);

        if (!isJson)
        {
            logger.LogWarning(
                "Workday API returned unexpected content type {ContentType} with HTTP {HttpStatusCode} from {RequestHost}{RequestPath}, elapsed {DurationMs}ms",
                contentType, statusCode, requestHost, requestPath, durationMs);

            // An HTML maintenance/error page may be returned as HTTP 200.
            if (contentType.Equals("text/html", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidDataException(
                    $"Workday API returned HTML instead of JSON from {requestHost}{requestPath} (HTTP {statusCode})");
            }
        }

        var content = await response.Content.ReadAsStringAsync(cancellationToken);
        try
        {
            var result = JsonSerializer.Deserialize<T>(content, JsonOptions)
                ?? throw new JsonException("Workday API returned a null JSON payload");

            logger.LogDebug(
                "Workday API returned HTTP {HttpStatusCode} from {RequestHost}{RequestPath} in {DurationMs}ms",
                statusCode, requestHost, requestPath, durationMs);
            return result;
        }
        catch (JsonException exception)
        {
            logger.LogWarning(
                "Workday API returned invalid JSON with HTTP {HttpStatusCode} from {RequestHost}{RequestPath}, content type {ContentType}, elapsed {DurationMs}ms",
                statusCode, requestHost, requestPath, contentType, durationMs);

            throw new InvalidDataException(
                $"Workday API returned invalid JSON from {requestHost}{requestPath} (HTTP {statusCode})",
                exception);
        }
    }
}
