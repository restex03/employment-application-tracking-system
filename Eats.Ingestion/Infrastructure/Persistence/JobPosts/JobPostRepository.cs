using Eats.Ingestion.Domain.JobPosts;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Globalization;
using System.Text.Json;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostRepository(EatsIngestionDbContext dbContext) : IJobPostRepository
{
    public async Task Upsert(JobPost jobPost)
    {
        await UpsertBatch([jobPost]);
    }

    public async Task UpsertMany(IEnumerable<JobPost> jobPosts)
    {
        foreach (var batch in jobPosts.Chunk(250))
        {
            await UpsertBatch(batch);
        }
    }

    public async Task<JobPost> GetByIdOrThrow(Guid id)
    {
        var jobPost = await dbContext.JobPosts
            .Include(post => post.Detail)
            .FirstOrDefaultAsync(post => post.Id == id);

        return jobPost ?? throw new KeyNotFoundException($"Job post '{id}' was not found.");
    }

    private async Task UpsertBatch(IReadOnlyCollection<JobPost> jobPosts)
    {
        if (jobPosts.Count == 0)
        {
            return;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync();
        var values = new List<string>(jobPosts.Count);
        var parameters = new List<object>(jobPosts.Count * 9);
        var index = 0;
        foreach (var jobPost in jobPosts)
        {
            var suffix = index.ToString(CultureInfo.InvariantCulture);
            values.Add(
                $"(@Id{suffix}, @SourceId{suffix}, @RequisitionId{suffix}, @Title{suffix}, " +
                $"@DetailPath{suffix}, @Location{suffix}, @DaysOld{suffix}, @RemoteType{suffix}, " +
                $"@CreatedAt{suffix})");
            parameters.Add(new NpgsqlParameter($"Id{suffix}", jobPost.Id));
            parameters.Add(new NpgsqlParameter($"SourceId{suffix}", jobPost.SourceId));
            parameters.Add(new NpgsqlParameter($"RequisitionId{suffix}", (object?)jobPost.RequisitionId ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"Title{suffix}", jobPost.Title));
            parameters.Add(new NpgsqlParameter($"DetailPath{suffix}", jobPost.DetailPath));
            parameters.Add(new NpgsqlParameter($"Location{suffix}", (object?)jobPost.Location ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"DaysOld{suffix}", (object?)jobPost.DaysOld ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"RemoteType{suffix}", (object?)jobPost.RemoteType ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"CreatedAt{suffix}", jobPost.CreatedAt));
            index++;
        }

        var sql = $"""
            INSERT INTO "JobPosts" (
                "{nameof(JobPost.Id)}",
                "{nameof(JobPost.SourceId)}",
                "{nameof(JobPost.RequisitionId)}",
                "{nameof(JobPost.Title)}",
                "{nameof(JobPost.DetailPath)}",
                "{nameof(JobPost.Location)}",
                "{nameof(JobPost.DaysOld)}",
                "{nameof(JobPost.RemoteType)}",
                "{nameof(JobPost.CreatedAt)}"
            )
            VALUES {string.Join(",\n", values)}
            ON CONFLICT ("{nameof(JobPost.SourceId)}", "{nameof(JobPost.DetailPath)}")
            DO UPDATE SET
                "{nameof(JobPost.Location)}" = EXCLUDED."{nameof(JobPost.Location)}",
                "{nameof(JobPost.DaysOld)}" = EXCLUDED."{nameof(JobPost.DaysOld)}",
                "{nameof(JobPost.RemoteType)}" = EXCLUDED."{nameof(JobPost.RemoteType)}"
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql, parameters);

        var detailedPosts = jobPosts.Where(jobPost => jobPost.Detail is not null).ToArray();
        if (detailedPosts.Length > 0)
        {
            await UpsertDetails(detailedPosts);
        }

        await transaction.CommitAsync();
    }

    private async Task UpsertDetails(IReadOnlyCollection<JobPost> jobPosts)
    {
        var canonicalValues = new List<string>(jobPosts.Count);
        var canonicalParameters = new List<object>(jobPosts.Count * 4);
        var detailValues = new List<string>(jobPosts.Count);
        var detailParameters = new List<object>(jobPosts.Count * 9);

        var index = 0;
        foreach (var jobPost in jobPosts)
        {
            var detail = jobPost.Detail!;
            var suffix = index.ToString(CultureInfo.InvariantCulture);
            canonicalValues.Add($"(@PostId{suffix}, @RequisitionId{suffix}, @Title{suffix}, @PostRemoteType{suffix})");
            canonicalParameters.Add(new NpgsqlParameter($"PostId{suffix}", jobPost.Id));
            canonicalParameters.Add(new NpgsqlParameter($"RequisitionId{suffix}", (object?)jobPost.RequisitionId ?? DBNull.Value));
            canonicalParameters.Add(new NpgsqlParameter($"Title{suffix}", jobPost.Title));
            canonicalParameters.Add(new NpgsqlParameter($"PostRemoteType{suffix}", (object?)jobPost.RemoteType ?? DBNull.Value));

            detailValues.Add(
                $"(@DetailId{suffix}, @JobPostId{suffix}, @Description{suffix}, @EmploymentType{suffix}, " +
                $"@Locations{suffix}, @ValidThrough{suffix}, @DetailRemoteType{suffix}, " +
                $"@ApplicantLocations{suffix}, @FetchedAt{suffix})");
            detailParameters.Add(new NpgsqlParameter($"DetailId{suffix}", detail.Id));
            detailParameters.Add(new NpgsqlParameter($"JobPostId{suffix}", jobPost.Id));
            detailParameters.Add(new NpgsqlParameter($"Description{suffix}", detail.Description));
            detailParameters.Add(new NpgsqlParameter($"EmploymentType{suffix}", (object?)detail.EmploymentType ?? DBNull.Value));
            detailParameters.Add(new NpgsqlParameter(
                $"Locations{suffix}",
                SerializeArray(detail.Locations)));
            detailParameters.Add(new NpgsqlParameter($"ValidThrough{suffix}", (object?)detail.ValidThrough ?? DBNull.Value));
            detailParameters.Add(new NpgsqlParameter($"DetailRemoteType{suffix}", (object?)detail.RemoteType ?? DBNull.Value));
            detailParameters.Add(new NpgsqlParameter(
                $"ApplicantLocations{suffix}",
                SerializeArray(detail.ApplicantLocations)));
            detailParameters.Add(new NpgsqlParameter($"FetchedAt{suffix}", detail.FetchedAt));
            index++;
        }

        var updatePostsSql = $"""
            UPDATE "{nameof(JobPost)}" AS post
            SET
                "{nameof(JobPost.RequisitionId)}" = COALESCE(data."{nameof(JobPost.RequisitionId)}", post."{nameof(JobPost.RequisitionId)}"),
                "{nameof(JobPost.Title)}" = data."{nameof(JobPost.Title)}",
                "{nameof(JobPost.RemoteType)}" = COALESCE(data."{nameof(JobPost.RemoteType)}", post."{nameof(JobPost.RemoteType)}")
            FROM (VALUES {string.Join(",\n", canonicalValues)}) AS data(
                "{nameof(JobPost.Id)}",
                "{nameof(JobPost.RequisitionId)}",
                "{nameof(JobPost.Title)}",
                "{nameof(JobPost.RemoteType)}"
            )
            WHERE post."{nameof(JobPost.Id)}" = data."{nameof(JobPost.Id)}"
            """;
        await dbContext.Database.ExecuteSqlRawAsync(updatePostsSql, canonicalParameters);

        var upsertDetailsSql = $"""
            INSERT INTO "JobPostDetails" (
                "{nameof(JobPostDetail.Id)}",
                "{nameof(JobPostDetail.JobPostId)}",
                "{nameof(JobPostDetail.Description)}",
                "{nameof(JobPostDetail.EmploymentType)}",
                "{nameof(JobPostDetail.Locations)}",
                "{nameof(JobPostDetail.ValidThrough)}",
                "{nameof(JobPostDetail.RemoteType)}",
                "{nameof(JobPostDetail.ApplicantLocations)}",
                "{nameof(JobPostDetail.FetchedAt)}"
            )
            VALUES {string.Join(",\n", detailValues)}
            ON CONFLICT ("{nameof(JobPostDetail.JobPostId)}")
            DO UPDATE SET
                "{nameof(JobPostDetail.Description)}" = EXCLUDED."{nameof(JobPostDetail.Description)}",
                "{nameof(JobPostDetail.EmploymentType)}" = EXCLUDED."{nameof(JobPostDetail.EmploymentType)}",
                "{nameof(JobPostDetail.Locations)}" = EXCLUDED."{nameof(JobPostDetail.Locations)}",
                "{nameof(JobPostDetail.ValidThrough)}" = EXCLUDED."{nameof(JobPostDetail.ValidThrough)}",
                "{nameof(JobPostDetail.RemoteType)}" = EXCLUDED."{nameof(JobPostDetail.RemoteType)}",
                "{nameof(JobPostDetail.ApplicantLocations)}" = EXCLUDED."{nameof(JobPostDetail.ApplicantLocations)}",
                "{nameof(JobPostDetail.FetchedAt)}" = EXCLUDED."{nameof(JobPostDetail.FetchedAt)}"
            """;
        await dbContext.Database.ExecuteSqlRawAsync(upsertDetailsSql, detailParameters);
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static object SerializeArray<T>(T[]? values)
    {
        return values is null ? DBNull.Value : JsonSerializer.Serialize(values, JsonOptions);
    }
}
