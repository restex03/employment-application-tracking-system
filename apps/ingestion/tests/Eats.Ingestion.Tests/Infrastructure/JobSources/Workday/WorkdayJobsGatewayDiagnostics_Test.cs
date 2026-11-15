using System.Net;
using System.Net.Http.Headers;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Microsoft.Extensions.Logging.Abstractions;

namespace Eats.Ingestion.Tests.Infrastructure.JobSources.Workday;

public sealed class WorkdayJobsGatewayDiagnostics_Test
{
    private static readonly Uri BaseUri =
        new("https://example.workdayjobs.com/wday/cxs/example/careers/");

    [Fact]
    public async Task Search_ThrowsSanitizedHttpExceptionForFailedResponse()
    {
        const string html = "<html>secret maintenance information</html>";
        using var httpClient = CreateClient(
            HttpStatusCode.ServiceUnavailable, "text/html", html);
        var gateway = new WorkdayJobsGateway(
            httpClient, NullLogger<WorkdayJobsGateway>.Instance);

        var exception = await Assert.ThrowsAsync<HttpRequestException>(() =>
            gateway.Search(BaseUri, 20, 0, null, CancellationToken.None));

        Assert.Equal(HttpStatusCode.ServiceUnavailable, exception.StatusCode);
        Assert.DoesNotContain(html, exception.Message);
        Assert.Contains("503", exception.Message);
    }

    [Fact]
    public async Task Search_RejectsHtmlReturnedWithSuccessStatus()
    {
        using var httpClient = CreateClient(
            HttpStatusCode.OK, "text/html", "<html>maintenance</html>");
        var gateway = new WorkdayJobsGateway(
            httpClient, NullLogger<WorkdayJobsGateway>.Instance);

        var exception = await Assert.ThrowsAsync<InvalidDataException>(() =>
            gateway.Search(BaseUri, 20, 0, null, CancellationToken.None));

        Assert.Contains("HTML instead of JSON", exception.Message);
        Assert.DoesNotContain("maintenance</html>", exception.Message);
    }

    [Fact]
    public async Task Search_DeserializesSuccessfulJson()
    {
        using var httpClient = CreateClient(
            HttpStatusCode.OK, "application/json",
            "{\"total\":0,\"jobPostings\":[]}");
        var gateway = new WorkdayJobsGateway(
            httpClient, NullLogger<WorkdayJobsGateway>.Instance);

        var response = await gateway.Search(
            BaseUri, 20, 0, null, CancellationToken.None);

        Assert.Equal(0, response.Total);
        Assert.Empty(response.JobPostings);
    }

    private static HttpClient CreateClient(
        HttpStatusCode statusCode, string contentType, string body)
    {
        return new HttpClient(new StubHandler((request, _) =>
        {
            var response = new HttpResponseMessage(statusCode)
            {
                RequestMessage = request,
                Content = new StringContent(body)
            };
            response.Content.Headers.ContentType =
                new MediaTypeHeaderValue(contentType);
            return Task.FromResult(response);
        }));
    }

    private sealed class StubHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> send)
        : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken) =>
            send(request, cancellationToken);
    }
}
