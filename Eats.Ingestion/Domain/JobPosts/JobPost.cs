namespace Eats.Ingestion.Domain.JobPosts;

public sealed class JobPost
{
    private JobPost()
    {
    }

    public JobPost(
        Guid id,
        string sourceId,
        string title,
        string detailPath,
        DateTime createdAt,
        string? requisitionId = null,
        string? location = null,
        int? daysOld = null,
        JobPostDetail? detail = null,
        string? remoteType = null,
        bool dismissed = false)
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
        Dismissed = dismissed;
        if (detail is not null)
        {
            HydrateDetail(detail);
        }
    }

    public Guid Id { get; private set; }
    public string SourceId { get; private set; } = string.Empty;
    public string? RequisitionId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string DetailPath { get; private set; } = string.Empty;
    public string? Location { get; private set; }
    public int? DaysOld { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public JobPostDetail? Detail { get; private set; }
    public string? RemoteType { get; private set; }
    public bool Dismissed { get; private set; }

    public void HydrateDetail(JobPostDetail detail)
    {
        Detail = detail;
        detail.AttachTo(this);
    }

    public void UpdateFromDetail(string? requisitionId, string title, string? remoteType)
    {
        RequisitionId = requisitionId ?? RequisitionId;
        Title = title;
        RemoteType = remoteType ?? RemoteType;
    }

    public void UpdateDiscoveryData(string? location, int? daysOld, string? remoteType)
    {
        Location = location;
        DaysOld = daysOld;
        RemoteType = remoteType;
    }

}
