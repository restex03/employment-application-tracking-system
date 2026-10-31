using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobPostService
{
    Task AddMany(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default);
    Task Update(JobPost jobPost, CancellationToken cancellationToken = default);
    Task<JobPostDto> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<JobPostDto>> ListAsync(JobPostQuery query, CancellationToken ct);
    Task<int> CountAsync(JobPostQuery query, CancellationToken ct);

    public class Imp(
        IJobPostRepository jobPostRepository,
        IJobSourceRepository jobSourceRepository,
        IJobPostDiscoveryServiceFactory discoveryServiceFactory,
        ILogger<Imp> logger) 
    : IJobPostService
    {
        public Task AddMany(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return jobPostRepository.UpsertManyAsync(jobPosts, cancellationToken);
        }

        public Task Update(JobPost jobPost, CancellationToken cancellationToken = default)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return jobPostRepository.UpsertAsync(jobPost, cancellationToken);
        }

        public async Task<JobPostDto> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var jobPost = await jobPostRepository.GetByIdOrThrowAsync(id, cancellationToken);
            
            // Hydrate JobPostDetail if null upon JobPost fetch
            if (jobPost.Detail is null)
            {
                logger.LogDebug("Syncing details for job post {JobPostId}", jobPost.Id);
                var source = await GetSource(jobPost.SourceId, cancellationToken);
                var discoveryService = discoveryServiceFactory.Create(source);
                var detail = await discoveryService.FetchDetail(jobPost.DetailPath, cancellationToken);

                jobPost.HydrateDetail(detail);
                await jobPostRepository.UpsertAsync(jobPost, cancellationToken);
            }

            return MapToViewModel(jobPost);

        }

        private async Task<JobSource> GetSource(
            Guid sourceId,
            CancellationToken cancellationToken)
        {
            var source = await jobSourceRepository.GetByIdOrThrowAsync(sourceId, cancellationToken);
            return source ?? throw new InvalidOperationException($"Job source not found: {sourceId}");
        }

        public async Task<IReadOnlyList<JobPostDto>> ListAsync(JobPostQuery query, CancellationToken ct)
        {
            var result = await jobPostRepository.ListAsync(query, ct);

            var mapped = result.Select(MapToViewModel).ToList();
            return mapped;
        }

        public Task<int> CountAsync(JobPostQuery query, CancellationToken ct)
        {
            return jobPostRepository.CountAsync(query, ct);
        }

        private JobPostDto MapToViewModel(JobPost jobPost)
        {
            return new JobPostDto
            {
                Id = jobPost.Id,
                SourceId = jobPost.SourceId,
                RequisitionId = jobPost.RequisitionId,
                Title = jobPost.Title,
                JobLink = jobPost.JobLink.AbsoluteUri,
                DetailPath = jobPost.DetailPath,
                Locations = jobPost.Locations,
                PostedDate = jobPost.PostedDate,
                CreatedAt = jobPost.IngestionDate,
                Detail = MapToDto(jobPost.Detail),
                RemoteType = jobPost.RemoteType,
            };
        }

        private static JobPostDetailDto? MapToDto(JobPostDetail? detail)
        {
            if (detail is null)
            {
                return null;
            }

            return new JobPostDetailDto
            {
                Id = detail.Id,
                Description = detail.Description,
                EmploymentType = detail.EmploymentType,
                Locations = detail.Locations?.Select(location => new JobPostLocationDto
                {
                    StreetAddress = location.StreetAddress,
                    City = location.City,
                    State = location.State,
                    PostalCode = location.PostalCode,
                    Country = location.Country
                }).ToArray(),
                ValidThrough = detail.ValidThrough,
                RemoteType = detail.RemoteType,
                ApplicantLocations = detail.ApplicantLocations,
                FetchedAt = detail.IngestionDate
            };
        }
    }
}