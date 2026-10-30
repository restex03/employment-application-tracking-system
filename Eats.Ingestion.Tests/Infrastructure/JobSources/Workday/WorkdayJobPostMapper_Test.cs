using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;

public sealed class WorkdayJobPostMapper_Test
{
    private readonly Mock<IJobLinkBuilder> _jobLinkBuilder = new();
    private readonly Mock<IWorkdayParser> _workdayParser = new();
    private readonly WorkdayJobPostMapper _sut;

    public WorkdayJobPostMapper_Test()
    {
        _jobLinkBuilder
            .Setup(builder => builder.BuildJobLink(It.IsAny<Uri>(), It.IsAny<string>()))
            .Returns(new Uri("https://builder.example.com/generated-job-link"));
        _sut = new WorkdayJobPostMapper(
            NullLogger<WorkdayJobPostMapper>.Instance,
            _jobLinkBuilder.Object,
            _workdayParser.Object);
    }

    [Fact]
    public void Maps_Posting_Fields_And_Source_Id()
    {
        var source = CreateSource();
        var posting = new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = "/job/Atlanta/Software-Engineer_R-123",
            LocationsText = "Atlanta, GA",
            PostedOn = "Posted Yesterday",
            RemoteType = "Hybrid"
        };

        var jobLink = new Uri("https://builder.example.com/mapped-job-link");
        _jobLinkBuilder
            .Setup(builder => builder.BuildJobLink(new Uri(source.BrowserBaseUrl), posting.ExternalPath))
            .Returns(jobLink);
        var postedDate = new DateTime(2026, 10, 29, 12, 0, 0, DateTimeKind.Utc);
        _workdayParser
            .Setup(parser => parser.MapToPostedDate(posting.PostedOn))
            .Returns(postedDate);
        _workdayParser
            .Setup(parser => parser.ParseRequisitionId(posting.ExternalPath))
            .Returns("R-123");
        var result = _sut.Map(source, posting);

        Assert.NotNull(result);
        Assert.Equal(source.Id, result.SourceId);
        Assert.Equal(posting.Title, result.Title);
        Assert.Equal(posting.ExternalPath, result.DetailPath);
        Assert.Equal("R-123", result.RequisitionId);
        Assert.Equal(posting.LocationsText, result.Location);
        Assert.Equal(postedDate, result.PostedDate);
        Assert.Equal(posting.RemoteType, result.RemoteType);
        _workdayParser.Verify(parser => parser.ParseRequisitionId(posting.ExternalPath), Times.Once);
        _workdayParser.Verify(parser => parser.MapToPostedDate(posting.PostedOn), Times.Once);
        Assert.Same(jobLink, result.JobLink);
        _jobLinkBuilder.Verify(
            builder => builder.BuildJobLink(new Uri(source.BrowserBaseUrl), posting.ExternalPath),
            Times.Once);
        _jobLinkBuilder.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData(null, "/jobs/123")]
    [InlineData("", "/jobs/123")]
    [InlineData(" \t", "/jobs/123")]
    [InlineData("Software Engineer", null)]
    [InlineData("Software Engineer", "")]
    [InlineData("Software Engineer", " \t")]
    public void Rejects_Missing_Or_Whitespace_Title_Or_Path(string? title, string? path)
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = title,
            ExternalPath = path
        });

        Assert.Null(result);
        _jobLinkBuilder.VerifyNoOtherCalls();
    }

    [Fact]
    public void Preserves_Missing_Optional_Fields()
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = "/jobs/123"
        });

        Assert.NotNull(result);
        Assert.Null(result.Location);
        Assert.Null(result.PostedDate);
        Assert.Null(result.RemoteType);
    }

    private static JobSource CreateSource(string browserBaseUrl = "https://acme.example.com/careers")
    {
        return new JobSource(Guid.NewGuid(), "Acme", "https://api.example.com/workday", browserBaseUrl);
    }

}
