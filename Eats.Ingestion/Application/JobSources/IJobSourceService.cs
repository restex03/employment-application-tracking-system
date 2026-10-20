public interface IJobSourceService
{
    Task<JobSourceResponse> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobSourceResponse>> GetAll(CancellationToken cancellationToken = default);
    // TODO: Add upsert operations
}

public class JobSourceResponse
{
    public required Guid Id { get; init; }
    public required string CompanyName { get; init; }
    public required string BaseUrl { get; set; }
    public required string BrowserBaseUrl { get; set; }

}