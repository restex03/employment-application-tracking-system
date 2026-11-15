using System.Text.Json;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Eats.Ingestion.Infrastructure.Persistence.JobPosts;

internal static class JsonArrayValueConverter<T>
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static readonly ValueConverter<T[]?, string?> Converter = new(
        value => value == null ? null : JsonSerializer.Serialize(value, JsonOptions),
        value => value == null ? null : JsonSerializer.Deserialize<T[]>(value, JsonOptions));

    public static readonly ValueComparer<T[]?> Comparer = new(
        (left, right) => left == right || (left != null && right != null && left.SequenceEqual(right)),
        value => value == null ? 0 : value.Aggregate(0, HashCode.Combine),
        value => value == null ? null : value.ToArray());
}
