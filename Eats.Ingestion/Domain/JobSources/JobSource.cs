namespace Eats.Ingestion.Domain.JobSources;

public sealed class JobSource
{
    private JobSource()
    {
    }

    public JobSource(string id, string companyName, string baseUrl, string browserBaseUrl)
    {
        Id = id;
        CompanyName = companyName;
        BaseUrl = baseUrl;
        BrowserBaseUrl = browserBaseUrl;
    }

    public string Id { get; private set; } = string.Empty;
    public string CompanyName { get; private set; } = string.Empty;
    public string BaseUrl { get; private set; } = string.Empty;
    public string BrowserBaseUrl { get; private set; } = string.Empty;
}
