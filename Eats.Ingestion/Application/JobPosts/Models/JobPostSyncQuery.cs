public class JobPostSyncQuery
{
    public required DateTime FromDate { get; init; }
    public required int PageCount { get; init; }
    public required int PageNumber { get; init; }
}