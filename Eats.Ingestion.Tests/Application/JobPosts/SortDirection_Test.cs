using Eats.Ingestion.Application.JobPosts.Models;

namespace Eats.Ingestion.Tests.Application.JobPosts;

public sealed class SortDirection_Test
{
    [Theory]
    [InlineData(SortDirection.Values.Ascending)]
    [InlineData(SortDirection.Values.Descending)]
    public void TryParse_Preserves_Wire_Value(string value)
    {
        Assert.True(SortDirection.TryParse(value, out var direction));
        Assert.Equal(value, direction.Value);
        Assert.Equal(value, direction.ToString());
        Assert.Equal(value == SortDirection.Values.Ascending ? SortDirection.Ascending : SortDirection.Descending, direction);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("dsc")]
    [InlineData("ASC")]
    [InlineData("invalid")]
    [InlineData("asc,desc")]
    public void TryParse_Rejects_Unsupported_Values(string? value)
    {
        Assert.False(SortDirection.TryParse(value, out var direction));
        Assert.Null(direction);
    }
}
