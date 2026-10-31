namespace Eats.Ingestion.Domain.JobPosts;

public sealed class JobPostDetail
{
    private JobPostDetail()
    {
    }

    public JobPostDetail(
        Guid jobPostId,
        string description,
        string? employmentType = null,
        JobPostLocation[]? locations = null,
        string? validThrough = null,
        string? remoteType = null,
        string[]? applicantLocations = null,
        DateTime ingestionDate = default)
    {
        JobPostId = jobPostId;
        Description = description;
        EmploymentType = employmentType;
        Locations = locations;
        ValidThrough = validThrough;
        RemoteType = remoteType;
        ApplicantLocations = applicantLocations;
        IngestionDate = ingestionDate;
    }

    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid JobPostId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public string? EmploymentType { get; private set; }
    public JobPostLocation[]? Locations { get; private set; }
    public string? ValidThrough { get; private set; }
    public string? RemoteType { get; private set; }
    public string[]? ApplicantLocations { get; private set; }
    public DateTime IngestionDate { get; private set; }
}
