using System.Diagnostics.CodeAnalysis;

namespace Eats.Ingestion.Application.JobPosts.Models;

/// <summary>A supported job post sort field, parsed from its query-string value.</summary>
public sealed record JobPostSortBy
{
    private JobPostSortBy(string value) => Value = value;

    public string Value { get; }

    public static JobPostSortBy CompanyName { get; } = new(Values.CompanyName);
    public static JobPostSortBy RequisitionId { get; } = new(Values.RequisitionId);
    public static JobPostSortBy Title { get; } = new(Values.Title);
    public static JobPostSortBy PostedDate { get; } = new(Values.PostedDate);

    public static bool TryParse(string? value, [NotNullWhen(true)] out JobPostSortBy? result)
    {
        result = value switch
        {
            Values.CompanyName => CompanyName,
            Values.RequisitionId => RequisitionId,
            Values.Title => Title,
            Values.PostedDate => PostedDate,
            _ => null
        };
        return result is not null;
    }

    public override string ToString() => Value;

    public static class Values
    {
        public const string CompanyName = "companyName";
        public const string RequisitionId = "requisitionId";
        public const string Title = "title";
        public const string PostedDate = "postedDate";
    }
}
