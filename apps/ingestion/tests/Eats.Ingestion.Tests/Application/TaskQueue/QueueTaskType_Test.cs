using System.Text.Json;
using Eats.Ingestion.Application.TaskQueue.Models;
using static Eats.Ingestion.Application.Routes.TaskQueueApi;

namespace Eats.Ingestion.Tests.Application.TaskQueue;

public sealed class QueueTaskType_Test
{
    [Theory]
    [InlineData(QueueTaskType.Values.SyncJobPosts)]
    public void TryParse_Preserves_The_Wire_Value(string value)
    {
        Assert.True(QueueTaskType.TryParse(value, out var type));
        Assert.Equal(value, type.Value);
        Assert.Equal(value, type.ToString());
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("syncJobPosts")]
    [InlineData("invalid")]
    public void TryParse_Rejects_Unsupported_Values(string? value)
    {
        Assert.False(QueueTaskType.TryParse(value, out var type));
        Assert.Null(type);
    }

    [Fact]
    public void Json_Deserializes_Valid_Wire_Value()
    {
        var json = """{"type":"SyncJobPosts","sourceIds":[]}""";
        var request = JsonSerializer.Deserialize<JobPostSyncRequest>(json, JsonSerializerOptions.Web);

        Assert.NotNull(request);
        Assert.Equal(QueueTaskType.SyncJobPosts, request.Type);
    }

    [Theory]
    [InlineData("\"invalid\"")]
    [InlineData("\"\"")]
    [InlineData("null")]
    [InlineData("1")]
    public void Json_Rejects_Unsupported_Values(string typeJson)
    {
        var json = $$"""{"type":{{typeJson}},"sourceIds":[]}""";
        Assert.Throws<JsonException>(() =>
            JsonSerializer.Deserialize<JobPostSyncRequest>(json, JsonSerializerOptions.Web));
    }

    [Fact]
    public void Json_Serializes_To_Wire_Value()
    {
        var json = JsonSerializer.Serialize(QueueTaskType.SyncJobPosts);
        Assert.Equal("\"SyncJobPosts\"", json);
    }
}
