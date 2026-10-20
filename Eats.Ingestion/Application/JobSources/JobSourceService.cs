using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public class JobSourceService : IJobSourceService
{
    public JobSourceService(IJobSourceRepository jobSourceRepository)
    {
        _jobSourceRepository = jobSourceRepository;
    }

    private readonly IJobSourceRepository _jobSourceRepository;

    public async Task<IReadOnlyList<JobSourceResponse>> GetAll(CancellationToken cancellationToken = default)
    {
        var result = await _jobSourceRepository.GetAllAsync(cancellationToken);
        return result.Select(source => new JobSourceResponse
        {
            Id = source.Id,
            CompanyName = source.CompanyName,
            BaseUrl = source.BaseUrl,
            BrowserBaseUrl = source.BrowserBaseUrl
        }).ToList();
    }

    public async Task<JobSourceResponse> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default)
    {
        var result = await _jobSourceRepository.GetByIdOrThrowAsync(id, cancellationToken);
        return new JobSourceResponse
        {
            Id = result.Id,
            CompanyName = result.CompanyName,
            BaseUrl = result.BaseUrl,
            BrowserBaseUrl = result.BrowserBaseUrl
        };
    }
}