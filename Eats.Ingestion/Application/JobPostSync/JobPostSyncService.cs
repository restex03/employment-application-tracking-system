using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobPostSyncService
{
       Task SyncJobPostsOrThrowAsync(Guid sourceId, string? searchText = null, CancellationToken cancellationToken = default);

     public class Imp(
            IJobSourceRepository jobSourceRepository,
            IJobPostRepository jobPostRepository,
            IJobPostDiscoveryServiceFactory discoveryServiceFactory,
            IJobPostScreener screener,
            ILogger<Imp> logger) 
        : IJobPostSyncService
     {


        public async Task SyncJobPostsOrThrowAsync(
            Guid sourceId,
            string? searchText = null,
            CancellationToken ct = default)
        {

            var source = await jobSourceRepository.GetByIdOrThrowAsync(sourceId, ct);
            
            var jobsDiscovered = 0;

            logger.LogInformation("Syncing job posts from source {CompanyName}", source.CompanyName);
            var discoveryService = discoveryServiceFactory.Create(source);
            var discoveredJobs = await discoveryService.FetchList(searchText, ct);
            var jobPosts = discoveredJobs
                .Where(screener.ScreenJobPost)
                .Select(CreateJobPost)
                .ToArray();

            await jobPostRepository.UpsertManyAsync(jobPosts, ct);
            jobsDiscovered += jobPosts.Length;

            logger.LogInformation(
                "Discovered {JobsDiscovered} jobs from {CompanyName}",
                jobsDiscovered,
                source.CompanyName);
        }


        private static JobPost CreateJobPost(JobPostDiscoveryDto discovery)
        {
            return new JobPost(
                Guid.NewGuid(),
                discovery.SourceId,
                discovery.Title,
                discovery.DetailPath,
                DateTime.UtcNow,
                discovery.JobLink,
                discovery.RequisitionId,
                string.IsNullOrWhiteSpace(discovery.Location) ? [] : [discovery.Location],
                postedDate: discovery.PostedDate,
                remoteType: discovery.RemoteType);
        }
     }
}