using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Globalization;
using System.Text.Json;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

public sealed class JobPostRepository(EatsIngestionDbContext dbContext) : IJobPostRepository
{
    public async Task UpsertAsync(JobPost jobPost, CancellationToken cancellationToken = default)
    {
        await UpsertBatchAsync([jobPost], cancellationToken);
    }

    public async Task UpsertManyAsync(IEnumerable<JobPost> jobPosts, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        foreach (var batch in jobPosts.Chunk(250))
        {
            await UpsertBatchAsync(batch, cancellationToken);
        }
    }

    public async Task<JobPost> GetByIdOrThrowAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var jobPost = await dbContext.JobPosts
            .Include(post => post.Detail)
            .FirstOrDefaultAsync(post => post.Id == id, cancellationToken);

        return jobPost ?? throw new KeyNotFoundException($"Job post '{id}' was not found.");
    }

    private async Task UpsertBatchAsync(
        IReadOnlyCollection<JobPost> jobPosts,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (jobPosts.Count == 0)
        {
            return;
        }

        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var values = new List<string>(jobPosts.Count);
        var parameters = new List<object>(jobPosts.Count * 10);
        var index = 0;
        foreach (var jobPost in jobPosts)
        {
            var suffix = index.ToString(CultureInfo.InvariantCulture);
            values.Add(
                $"(@Id{suffix}, @SourceId{suffix}, @RequisitionId{suffix}, @Title{suffix}, " +
                $"@DetailPath{suffix}, @JobLink{suffix}, @Locations{suffix}, @PostedDate{suffix}, @RemoteType{suffix}, " +
                $"@CreatedAt{suffix})");
            parameters.Add(new NpgsqlParameter($"Id{suffix}", jobPost.Id));
            parameters.Add(new NpgsqlParameter($"SourceId{suffix}", jobPost.SourceId));
            parameters.Add(new NpgsqlParameter($"RequisitionId{suffix}", (object?)jobPost.RequisitionId ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"Title{suffix}", jobPost.Title));
            parameters.Add(new NpgsqlParameter($"DetailPath{suffix}", jobPost.DetailPath));
            parameters.Add(new NpgsqlParameter($"JobLink{suffix}", jobPost.JobLink.ToString()));
            parameters.Add(new NpgsqlParameter($"Locations{suffix}", jobPost.Locations));
            parameters.Add(new NpgsqlParameter($"PostedDate{suffix}", (object?)jobPost.PostedDate ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"RemoteType{suffix}", (object?)jobPost.RemoteType ?? DBNull.Value));
            parameters.Add(new NpgsqlParameter($"CreatedAt{suffix}", jobPost.IngestionDate));
            index++;
        }

        var sql = $"""
            INSERT INTO "JobPosts" (
                "{nameof(JobPost.Id)}",
                "{nameof(JobPost.SourceId)}",
                "{nameof(JobPost.RequisitionId)}",
                "{nameof(JobPost.Title)}",
                "{nameof(JobPost.DetailPath)}",
                "{nameof(JobPost.JobLink)}",
                "{nameof(JobPost.Locations)}",
                "{nameof(JobPost.PostedDate)}",
                "{nameof(JobPost.RemoteType)}",
                "{nameof(JobPost.IngestionDate)}"
            )
            VALUES {string.Join(",\n", values)}
            ON CONFLICT ("{nameof(JobPost.SourceId)}", "{nameof(JobPost.DetailPath)}")
            DO UPDATE SET
                "{nameof(JobPost.Locations)}" = EXCLUDED."{nameof(JobPost.Locations)}",
                "{nameof(JobPost.RemoteType)}" = EXCLUDED."{nameof(JobPost.RemoteType)}"
            """;

        await dbContext.Database.ExecuteSqlRawAsync(sql, parameters, cancellationToken);

        var detailedPosts = jobPosts.Where(jobPost => jobPost.Detail is not null).ToArray();
        if (detailedPosts.Length > 0)
        {
            await UpsertDetails(detailedPosts, cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
    }

    private async Task UpsertDetails(
        IReadOnlyCollection<JobPost> jobPosts,
        CancellationToken cancellationToken)
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
            detailParameters.Add(new NpgsqlParameter($"FetchedAt{suffix}", detail.IngestionDate));
            index++;
        }

        var updatePostsSql = $"""
            UPDATE "JobPosts" AS post
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
        await dbContext.Database.ExecuteSqlRawAsync(updatePostsSql, canonicalParameters, cancellationToken);

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
                "{nameof(JobPostDetail.IngestionDate)}"
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
                "{nameof(JobPostDetail.IngestionDate)}" = EXCLUDED."{nameof(JobPostDetail.IngestionDate)}"
            """;
        await dbContext.Database.ExecuteSqlRawAsync(upsertDetailsSql, detailParameters, cancellationToken);
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static object SerializeArray<T>(T[]? values)
    {
        return values is null ? DBNull.Value : JsonSerializer.Serialize(values, JsonOptions);
    }

    public async Task<IReadOnlyList<JobPost>> ListAsync(JobPostQuery query, CancellationToken ct)
    {
        var queryable = await FilterAsync(query, ct);
        return await JobPostQuerySorting.Apply(queryable, dbContext.JobSources, query)
            .ThenBy(jobPost => jobPost.Id)
            .Skip((query.PageNumber - 1) * query.PageCount)
            .Take(query.PageCount)
            .ToListAsync(ct);
    }

    public async Task<int> CountAsync(JobPostQuery query, CancellationToken ct = default)
    {
        return await (await FilterAsync(query, ct)).CountAsync(ct);
    }

    private async Task<IQueryable<JobPost>> FilterAsync(JobPostQuery query, CancellationToken ct)
    {
        var queryable = dbContext.JobPosts.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.CompanyName))
        {
            var companyNamePattern = $"%{EscapeLikePattern(query.CompanyName)}%";
            var sourceIds = await dbContext.JobSources
                .Where(source => EF.Functions.ILike(source.CompanyName, companyNamePattern, "\\"))
                .Select(source => source.Id)
                .ToListAsync(ct);
            queryable = queryable.Where(jobPost => sourceIds.Contains(jobPost.SourceId));
        }

        if (!string.IsNullOrWhiteSpace(query.Title))
        {
            var titlePattern = $"%{EscapeLikePattern(query.Title)}%";
            queryable = queryable.Where(jobPost => EF.Functions.ILike(jobPost.Title, titlePattern, "\\"));
        }

        if (!string.IsNullOrWhiteSpace(query.RequisitionId))
        {
            var requisitionIdPattern = $"%{EscapeLikePattern(query.RequisitionId)}%";
            queryable = queryable.Where(jobPost =>
                jobPost.RequisitionId != null &&
                EF.Functions.ILike(jobPost.RequisitionId, requisitionIdPattern, "\\"));
        }

        if (!string.IsNullOrWhiteSpace(query.Location))
        {
            var locationPattern = $"%{EscapeLikePattern(query.Location)}%";
            queryable = queryable.Where(jobPost =>
                jobPost.Locations.Any(location => EF.Functions.ILike(location, locationPattern, "\\")));
        }

        if (query.PostedDate.HasValue)
        {
            queryable = queryable.Where(jobPost => jobPost.PostedDate >= query.PostedDate.Value);
        }

        return queryable;
    }

    private static string EscapeLikePattern(string value)
    {
        return value
            .Replace("\\", "\\\\")
            .Replace("%", "\\%")
            .Replace("_", "\\_");
    }


    public async Task<IReadOnlyList<JobPost>> GetNextRandomDryBatchAsync(int count, CancellationToken cancellationToken = default)
    {
        // Note: No tracking is used here to avoid loading unnecessary entity state.
        // UpsertAsync method above uses raw SQL instead of SaveChangesAsync, so 
        // no tracking is needed here.
        var result = await dbContext.JobPosts.AsNoTracking()
            .Where(jobPost => jobPost.Detail == null)
            .OrderBy(_ => EF.Functions.Random())
            .Take(count)
            .ToListAsync(cancellationToken);

        return result;
    }
}
