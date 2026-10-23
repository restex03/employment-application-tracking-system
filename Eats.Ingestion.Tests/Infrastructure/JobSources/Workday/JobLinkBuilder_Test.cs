using Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class JobLinkBuilder_Test
{
    private readonly IJobLinkBuilder _sut = new JobLinkBuilder();

    [Theory]
    [InlineData("https://acme.example.com/careers", "jobs/123",
        "https://acme.example.com/careers/jobs/123")]
    [InlineData("https://acme.example.com/careers/", "jobs/123",
        "https://acme.example.com/careers/jobs/123")]
    [InlineData("https://acme.example.com/careers", "/jobs/123",
        "https://acme.example.com/careers/jobs/123")]
    [InlineData("http://localhost:3000/workday/", "/job-posts/123",
        "http://localhost:3000/workday/job-posts/123")]
    [InlineData("https://travelers.wd5.myworkdayjobs.com/en-US/External",
        "/job/CT---Hartford/Software-Engineer-II_R-51277",
        "https://travelers.wd5.myworkdayjobs.com/en-US/External/job/CT---Hartford/Software-Engineer-II_R-51277")]
    [InlineData("https://acme.example.com", "/jobs/123",
        "https://acme.example.com/jobs/123")]
    public void Builds_JobLink_Preserving_Base_Path(
        string browserBaseUrl, string detailPath, string expectedJobLink)
    {
        var result = _sut.BuildJobLink(new Uri(browserBaseUrl), detailPath);

        Assert.Equal(expectedJobLink, result.AbsoluteUri);
    }
}
