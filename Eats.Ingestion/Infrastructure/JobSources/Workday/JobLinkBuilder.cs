namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class JobLinkBuilder : IJobLinkBuilder
{
    public Uri BuildJobLink(Uri detailBaseUrl, string detailPath)
    {
        var basePath = detailBaseUrl.AbsolutePath;
        var cleanBasePath = basePath.EndsWith('/') ? basePath[..^1] : basePath;
        var cleanDetailPath = detailPath.StartsWith('/') ? detailPath[1..] : detailPath;

        return new Uri(detailBaseUrl, $"{cleanBasePath}/{cleanDetailPath}");
    }
}
