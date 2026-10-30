using System.Diagnostics.CodeAnalysis;

namespace Eats.Ingestion.Application.JobPosts.Models;

/// <summary>A supported sort direction, parsed from its query-string value.</summary>
public sealed record SortDirection
{
    private SortDirection(string value) => Value = value;

    public string Value { get; }

    public static SortDirection Ascending { get; } = new(Values.Ascending);
    public static SortDirection Descending { get; } = new(Values.Descending);

    public static bool TryParse(string? value, [NotNullWhen(true)] out SortDirection? result)
    {
        result = value switch
        {
            Values.Ascending => Ascending,
            Values.Descending => Descending,
            _ => null
        };
        return result is not null;
    }

    public override string ToString() => Value;

    public static class Values
    {
        public const string Ascending = "asc";
        public const string Descending = "desc";
    }
}
