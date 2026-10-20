using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobSourceService
{
    Task<JobSourceResponse> GetByIdOrThrow(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobSourceResponse>> GetAll(CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobSourceResponse>> GetByCompanyName(string companyName, CancellationToken cancellationToken = default);

    // TODO: Add upsert operations


    public class Imp : IJobSourceService
    {
        public Imp(IJobSourceRepository jobSourceRepository)
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

        public async Task<IReadOnlyList<JobSourceResponse>> GetByCompanyName(string companyName, CancellationToken cancellationToken = default)
        {
            var result = await _jobSourceRepository.GetByCompanyNameAsync(companyName, cancellationToken);
            return result.Select(source => new JobSourceResponse
            {
                Id = source.Id,
                CompanyName = source.CompanyName,
                BaseUrl = source.BaseUrl,
                BrowserBaseUrl = source.BrowserBaseUrl
            }).ToList();
        }
    }
}

public class JobSourceResponse
{
    public required Guid Id { get; init; }
    public required string CompanyName { get; init; }
    public required string BaseUrl { get; set; }
    public required string BrowserBaseUrl { get; set; }

}