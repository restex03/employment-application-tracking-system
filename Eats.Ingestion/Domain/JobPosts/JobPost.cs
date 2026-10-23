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
        string? requisitionId = null,
        string? location = null,
        int? daysOld = null,
        JobPostDetail? detail = null,
        string? remoteType = null)
    {
        Id = id;
        SourceId = sourceId;
        RequisitionId = requisitionId;
        Title = title;
        DetailPath = detailPath;
        Location = location;
        DaysOld = daysOld;
        CreatedAt = createdAt;
        RemoteType = remoteType;
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
    public int? DaysOld { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public JobPostDetail? Detail { get; private set; }
    public string? RemoteType { get; private set; }

    public void HydrateDetail(JobPostDetail detail)
    {
        Detail = detail;
    }

    public void UpdateFromDetail(string? requisitionId, string? remoteType)
    {
        RequisitionId = requisitionId ?? RequisitionId;
        RemoteType = remoteType ?? RemoteType;
        // TODO: Update Location to include location details from the job post detail if available
    }

    public void UpdateDiscoveryData(string? location, int? daysOld, string? remoteType)
    {
        Location = location;
        DaysOld = daysOld;
        RemoteType = remoteType;
    }

}
