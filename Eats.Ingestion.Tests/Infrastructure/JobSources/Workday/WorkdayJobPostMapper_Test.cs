using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;
using Microsoft.Extensions.Logging.Abstractions;

public sealed class WorkdayJobPostMapper_Test
{
    private readonly FakeJobLinkBuilder _jobLinkBuilder = new();
    private readonly WorkdayJobPostMapper _sut;

    public WorkdayJobPostMapper_Test()
    {
        _sut = new WorkdayJobPostMapper(NullLogger<WorkdayJobPostMapper>.Instance, _jobLinkBuilder);
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

        var result = _sut.Map(source, posting);

        Assert.NotNull(result);
        Assert.Equal(source.Id, result.SourceId);
        Assert.Equal(posting.Title, result.Title);
        Assert.Equal(posting.ExternalPath, result.DetailPath);
        Assert.Equal("R-123", result.RequisitionId);
        Assert.Equal(posting.LocationsText, result.Location);
        Assert.Equal(1, result.DaysOld);
        Assert.Equal(posting.RemoteType, result.RemoteType);
        Assert.Same(_jobLinkBuilder.JobLink, result.JobLink);
        var call = Assert.Single(_jobLinkBuilder.Calls);
        Assert.Equal(new Uri(source.BrowserBaseUrl), call.BaseUrl);
        Assert.Equal(posting.ExternalPath, call.DetailPath);
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
        Assert.Empty(_jobLinkBuilder.Calls);
    }

    [Theory]
    [InlineData("JR123")]
    [InlineData("JR-123")]
    [InlineData("R123")]
    [InlineData("R-123")]
    [InlineData("J123")]
    [InlineData("P123")]
    [InlineData("26WD123")]
    [InlineData("12345")]
    [InlineData("jr-123")]
    public void Extracts_Requisition_Id_From_Path(string requisitionId)
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = $"/job/Atlanta/Software-Engineer_{requisitionId}"
        });

        Assert.NotNull(result);
        Assert.Equal(requisitionId, result.RequisitionId);
    }

    [Fact]
    public void Removes_Numeric_Suffix_From_Requisition_Id()
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = "/job/Atlanta/Software-Engineer_R-123-1"
        });

        Assert.NotNull(result);
        Assert.Equal("R-123", result.RequisitionId);
    }

    [Theory]
    [InlineData("/job/Atlanta/Software-Engineer")]
    [InlineData("/job/Atlanta/Software-Engineer_unknown")]
    [InlineData("/job/Atlanta/Software-Engineer_")]
    public void Falls_Back_To_Path_When_Requisition_Id_Is_Unrecognized(string path)
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = path
        });

        Assert.NotNull(result);
        Assert.Equal(path, result.RequisitionId);
    }

    [Theory]
    [InlineData("Posted Today", 0)]
    [InlineData("Posted Yesterday", 1)]
    [InlineData("Posted 2 Days Ago", 2)]
    [InlineData("Posted 15 Days Ago", 15)]
    [InlineData("Posted 30+ Days Ago", 30)]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("Unknown", null)]
    [InlineData("Posted 999999999999999 Days Ago", null)]
    public void Normalizes_Posted_Age(string? postedOn, int? expectedDaysOld)
    {
        var result = _sut.Map(CreateSource(), new WorkdayJobPosting
        {
            Title = "Software Engineer",
            ExternalPath = "/jobs/123",
            PostedOn = postedOn
        });

        Assert.NotNull(result);
        Assert.Equal(expectedDaysOld, result.DaysOld);
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
        Assert.Null(result.DaysOld);
        Assert.Null(result.RemoteType);
    }

    private static JobSource CreateSource(string browserBaseUrl = "https://acme.example.com/careers")
    {
        return new JobSource(Guid.NewGuid(), "Acme", "https://api.example.com/workday", browserBaseUrl);
    }

    private sealed class FakeJobLinkBuilder : IJobLinkBuilder
    {
        public Uri JobLink { get; } = new("https://builder.example.com/generated-job-link");
        public List<(Uri BaseUrl, string DetailPath)> Calls { get; } = [];

        public Uri BuildJobLink(Uri detailBaseUrl, string detailPath)
        {
            Calls.Add((detailBaseUrl, detailPath));
            return JobLink;
        }
    }
}
