namespace Eats.Ingestion.Domain.JobSources;

public sealed class JobSource
{
    private JobSource()
    {
    }

    public JobSource(Guid id, string companyName, string baseUrl, string browserBaseUrl)
    {
        Id = id != Guid.Empty 
            ? id 
            : throw new ArgumentException("Id cannot be empty.", nameof(id));
        CompanyName = !string.IsNullOrWhiteSpace(companyName) 
            ? companyName 
            : throw new ArgumentException("CompanyName cannot be null or whitespace.", nameof(companyName));
        BaseUrl = !string.IsNullOrWhiteSpace(baseUrl) 
            ? baseUrl 
            : throw new ArgumentException("BaseUrl cannot be null or whitespace.", nameof(baseUrl));
        BrowserBaseUrl = !string.IsNullOrWhiteSpace(browserBaseUrl) 
            ? browserBaseUrl 
            : throw new ArgumentException("BrowserBaseUrl cannot be null or whitespace.", nameof(browserBaseUrl));
    }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string CompanyName { get; private set; } = string.Empty;
    public string BaseUrl { get; private set; } = string.Empty;
    public string BrowserBaseUrl { get; private set; } = string.Empty;
}
