using System.Text.Json.Serialization;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday.Contracts;

public sealed class WorkdayJobsApiResponse
{
    [JsonPropertyName("total")]
    public int Total { get; init; }

    [JsonPropertyName("jobPostings")]
    public required List<WorkdayJobPosting> JobPostings { get; init; }
}

public sealed class WorkdayJobPosting
{
    [JsonPropertyName("title")]
    public string? Title { get; init; }

    [JsonPropertyName("externalPath")]
    public string? ExternalPath { get; init; }

    [JsonPropertyName("locationsText")]
    public string? LocationsText { get; init; }

    [JsonPropertyName("postedOn")]
    public string? PostedOn { get; init; }

    [JsonPropertyName("remoteType")]
    public string? RemoteType { get; init; }
}

public sealed class WorkdayJobDetailsApiResponse
{
    [JsonPropertyName("jobPostingInfo")]
    public required WorkdayJobPostingInfo JobPostingInfo { get; init; }
}

public sealed class WorkdayJobPostingInfo
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("title")]
    public string? Title { get; init; }

    [JsonPropertyName("jobDescription")]
    public string? JobDescription { get; init; }

    [JsonPropertyName("additionalLocations")]
    public List<string>? AdditionalLocations { get; init; }

    [JsonPropertyName("jobReqId")]
    public string? JobReqId { get; init; }

    [JsonPropertyName("timeType")]
    public string? TimeType { get; init; }

    [JsonPropertyName("location")]
    public string? Location { get; init; }

    [JsonPropertyName("country")]
    public WorkdayCountry? Country { get; init; }

    [JsonPropertyName("remoteType")]
    public string? RemoteType { get; init; }
}

public sealed class WorkdayCountry
{
    [JsonPropertyName("descriptor")]
    public string? Descriptor { get; init; }
}
