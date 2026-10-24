using System.Text.Json;
using Eats.Ingestion.Infrastructure.JobSources.Workday;
using Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;

namespace Eats.Ingestion.Tests.Infrastructure.JobSources.Workday;

public sealed class WorkdayJobDetailMapperTests
{
    [Fact]
    public void Map_ReturnsFlatDiscoveryWithSanitizedDescriptionAndDistinctLocations()
    {
        var mapper = new WorkdayJobDetailMapper();
        var response = new WorkdayJobDetailsApiResponse
        {
            JobPostingInfo = new WorkdayJobPostingInfo
            {
                Title = "Software Engineer",
                JobReqId = "REQ-123",
                JobDescription = "<h2><b>About the role</b></h2><script>alert(1)</script>",
                TimeType = "Full time",
                Location = "Atlanta",
                Country = new WorkdayCountry { Descriptor = "US" },
                AdditionalLocations = ["Boston", "Boston", " "],
                RemoteType = "Hybrid"
            }
        };
        var before = DateTime.UtcNow;

        var result = mapper.Map(response);

        Assert.Equal("Software Engineer", result.Title);
        Assert.Equal("REQ-123", result.RequisitionId);
        Assert.Equal("Full time", result.EmploymentType);
        Assert.Equal("Hybrid", result.RemoteType);
        Assert.Equal("<h5>About the role</h5>", result.Description);
        Assert.Collection(result.Locations!,
            location =>
            {
                Assert.Equal("Atlanta", location.City);
                Assert.Equal("US", location.Country);
            },
            location =>
            {
                Assert.Equal("Boston", location.City);
                Assert.Null(location.Country);
            });
        Assert.Null(result.ValidThrough);
        Assert.Null(result.ApplicantLocations);
        Assert.InRange(result.FetchedAt, before, DateTime.UtcNow);
        Assert.Equal(DateTimeKind.Utc, result.FetchedAt.Kind);

        using var json = JsonDocument.Parse(JsonSerializer.Serialize(result));
        Assert.Equal(result.Description, json.RootElement.GetProperty("Description").GetString());
        Assert.False(json.RootElement.TryGetProperty("Detail", out _));
        Assert.False(json.RootElement.TryGetProperty("Id", out _));
        Assert.False(json.RootElement.TryGetProperty("JobPostId", out _));
    }

    [Fact]
    public void Map_PreservesDefaultsForMissingOptionalFields()
    {
        var mapper = new WorkdayJobDetailMapper();
        var response = new WorkdayJobDetailsApiResponse
        {
            JobPostingInfo = new WorkdayJobPostingInfo()
        };

        var result = mapper.Map(response);

        Assert.Equal(string.Empty, result.Title);
        Assert.Equal(string.Empty, result.Description);
        Assert.Null(result.RequisitionId);
        Assert.Null(result.RemoteType);
        Assert.Null(result.EmploymentType);
        Assert.Empty(result.Locations!);
    }
}
