namespace Eats.Ingestion.Domain.JobPosts;

public sealed class JobPost
{
    private JobPost()
    {
    }

    public JobPost(
        Guid id,
        Guid sourceId,
        string title,
        string detailPath,
        DateTime createdAt,
        Uri jobLink,
        string? requisitionId = null,
        string? location = null,
        DateTime? postedDate = null,
        JobPostDetailDiscovery? detail = null,
        string? remoteType = null)
    {
        Id = id;
        SourceId = sourceId;
        RequisitionId = requisitionId;
        Title = title;
        DetailPath = detailPath;
        Location = location;
        PostedDate = postedDate;
        CreatedAt = createdAt;
        RemoteType = remoteType;
        JobLink = jobLink ?? throw new ArgumentNullException(nameof(jobLink));
        if (detail is not null)
        {
            HydrateDetail(detail);
        }
    }

    public Guid Id { get; private set; }
    public Guid SourceId { get; private set; }
    public string? RequisitionId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string DetailPath { get; private set; } = string.Empty;
    public string? Location { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public JobPostDetail? Detail { get; private set; }
    public string? RemoteType { get; private set; }
    public Uri JobLink { get; private set; } = null!;
    public DateTime? PostedDate { get; private set; }

    public void HydrateDetail(JobPostDetailDiscovery detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        Detail = new JobPostDetail(
            Id,
            detail.Description,
            detail.EmploymentType,
            detail.Locations,
            detail.ValidThrough,
            detail.RemoteType,
            detail.ApplicantLocations,
            detail.FetchedAt);
        RequisitionId = detail.RequisitionId ?? RequisitionId;
        RemoteType = detail.RemoteType ?? RemoteType;
        PostedDate = detail.PostedDate ?? PostedDate;
        // TODO: Update Location to include location details from the job post detail if available
    }

}
