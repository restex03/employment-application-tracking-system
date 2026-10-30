using System.Linq.Expressions;
using Eats.Ingestion.Application.JobPosts.Models;
using Eats.Ingestion.Domain.JobPosts;
using Eats.Ingestion.Domain.JobSources;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

internal static class JobPostQuerySorting
{
    internal static IOrderedQueryable<JobPost> Apply(
        IQueryable<JobPost> posts,
        IQueryable<JobSource> sources,
        JobPostQuery query)
    {
        var descending = (query.SortDirection ?? SortDirection.Descending) == SortDirection.Descending;
        var sortBy = query.SortBy ?? JobPostSortBy.PostedDate;
        if (sortBy == JobPostSortBy.PostedDate)
        {
            return Sort(posts, post => post.PostedDate, post => post.PostedDate == null, descending);
        }

        Expression<Func<JobPost, string?>> key = sortBy.Value switch
        {
            JobPostSortBy.Values.CompanyName => post => sources.Where(source => source.Id == post.SourceId)
                .Select(source => source.CompanyName.ToLower()).FirstOrDefault(),
            JobPostSortBy.Values.RequisitionId => post => post.RequisitionId == null ? null : post.RequisitionId.ToLower(),
            JobPostSortBy.Values.Title => post => post.Title.ToLower(),
            JobPostSortBy.Values.Location => post => string.Join("; ", post.Locations).ToLower(),
            _ => throw new InvalidOperationException("Unhandled job post sort field.")
        };
        var missing = Expression.Lambda<Func<JobPost, bool>>(
            Expression.OrElse(
                Expression.Equal(key.Body, Expression.Constant(null, typeof(string))),
                Expression.Equal(key.Body, Expression.Constant(string.Empty))),
            key.Parameters);
        return Sort(posts, key, missing, descending);
    }

    private static IOrderedQueryable<JobPost> Sort<TKey>(
        IQueryable<JobPost> posts,
        Expression<Func<JobPost, TKey>> key,
        Expression<Func<JobPost, bool>> missing,
        bool descending)
    {
        var knownFirst = posts.OrderBy(missing);
        return descending ? knownFirst.ThenByDescending(key) : knownFirst.ThenBy(key);
    }
}
