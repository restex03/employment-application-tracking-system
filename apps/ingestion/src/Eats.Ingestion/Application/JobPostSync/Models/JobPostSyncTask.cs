public class JobPostSyncTask
{
    public IEnumerable<Guid> SourceIds { get; set; } = [];
    public string SearchText { get; set; } = "";
}