using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobPosts;
using Eats.Ingestion.Infrastructure.Persistence.JobSources;

public interface IJobPostSyncService
{
       Task SyncJobPostsOrThrowAsync(IEnumerable<Guid> sourceIds, string? searchText = null, CancellationToken cancellationToken = default);

     public class Imp(
            IJobSourceRepository jobSourceRepository,
            IJobPostRepository jobPostRepository,
            IJobPostDiscoveryServiceFactory discoveryServiceFactory,
            IJobPostScreener screener,
            ILogger<Imp> logger) 
        : IJobPostSyncService
     {


        public async Task SyncJobPostsOrThrowAsync(
            IEnumerable<Guid> sourceIds,
            string? searchText = null,
            CancellationToken ct = default)
        {

            var sources = sourceIds.Any() 
                ? await jobSourceRepository.GetRangeAsync([.. sourceIds], ct)
                : await jobSourceRepository.GetAllAsync(ct);
            
            var sourcesSynced = 0;
            var jobsDiscovered = 0;

            foreach (var source in sources)
            {

                logger.LogDebug("Syncing job posts from source {CompanyName}", source.CompanyName);
                var discoveryService = discoveryServiceFactory.Create(source);
                var discoveredJobs = await discoveryService.FetchList(searchText, ct);
                var jobPosts = discoveredJobs
                    .Where(screener.ScreenJobPost)
                    .Select(CreateJobPost)
                    .ToArray();

                await jobPostRepository.UpsertMany(jobPosts);
                sourcesSynced++;
                jobsDiscovered += jobPosts.Length;

            }

            logger.LogDebug(
                "Synced {SourcesSynced} sources and discovered {JobsDiscovered} jobs",
                sourcesSynced,
                jobsDiscovered);
            logger.LogDebug("Completed syncing all job sources");
        }


        private static JobPost CreateJobPost(JobPostDiscovery discovery)
        {
            return new JobPost(
                Guid.NewGuid(),
                discovery.SourceId,
                discovery.Title,
                discovery.DetailPath,
                DateTime.UtcNow,
                discovery.RequisitionId,
                discovery.Location,
                discovery.DaysOld,
                remoteType: discovery.RemoteType);
        }
     }
}