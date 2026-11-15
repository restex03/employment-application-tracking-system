using System.Diagnostics.CodeAnalysis;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Eats.Ingestion.Application.TaskQueue.Models;

/// <summary>A supported queue task type, parsed from its wire value.</summary>
[JsonConverter(typeof(Converter))]
public sealed record QueueTaskType
{
    private QueueTaskType(string value) => Value = value;

    public string Value { get; }

    public static QueueTaskType SyncJobPosts { get; } = new(Values.SyncJobPosts);

    public static bool TryParse(string? value, [NotNullWhen(true)] out QueueTaskType? result)
    {
        result = value switch
        {
            Values.SyncJobPosts => SyncJobPosts,
            _ => null
        };
        return result is not null;
    }

    public override string ToString() => Value;

    public static class Values
    {
        public const string SyncJobPosts = "SyncJobPosts";
    }

    public sealed class Converter : JsonConverter<QueueTaskType>
    {
        // Ensure Read is invoked for null tokens so they are rejected too.
        public override bool HandleNull => true;

        public override QueueTaskType Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.TokenType == JsonTokenType.String ? reader.GetString() : null;
            return TryParse(value, out var result)
                ? result
                : throw new JsonException($"Unsupported queue task type: '{value}'.");
        }

        public override void Write(Utf8JsonWriter writer, QueueTaskType value, JsonSerializerOptions options)
            => writer.WriteStringValue(value.Value);
    }
}
