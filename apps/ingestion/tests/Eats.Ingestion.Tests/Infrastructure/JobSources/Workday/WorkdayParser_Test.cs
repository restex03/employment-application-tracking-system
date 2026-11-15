using Eats.Ingestion.Infrastructure.JobSources.Workday;

public sealed class WorkdayParser_Test
{
    private readonly IWorkdayParser.Imp _sut = new();

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" \t\r\n")]
    [InlineData(",,,")]
    [InlineData("1 Location")]
    [InlineData("2 Locations")]
    [InlineData("30 LOCATIONS")]
    [InlineData("2 Locations, 3 Locations")]
    public void ParseLocations_Returns_Null_When_No_Locations_Remain(string? locationsText)
    {
        var result = _sut.ParseLocations(locationsText);

        Assert.Null(result);
    }

    [Theory]
    [InlineData("Atlanta", "Atlanta")]
    [InlineData("Atlanta, GA", "Atlanta, GA")]
    [InlineData("  Atlanta ,  GA  ", "Atlanta, GA")]
    [InlineData("Atlanta,,GA,", "Atlanta, GA")]
    [InlineData("Atlanta, GA, Boston, MA", "Atlanta, GA, Boston, MA")]
    [InlineData("Remote", "Remote")]
    [InlineData("Locations", "Locations")]
    [InlineData("123 Main Street, Boston", "123 Main Street, Boston")]
    public void ParseLocations_Normalizes_Comma_Separated_Location_Text(string locationsText, string expected)
    {
        var result = _sut.ParseLocations(locationsText);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("2 Locations, Atlanta, GA", "Atlanta, GA")]
    [InlineData("Atlanta, 2 Locations, GA", "Atlanta, GA")]
    [InlineData("Atlanta, GA, 2 Locations", "Atlanta, GA")]
    [InlineData("1 location, Atlanta, 30 LOCATIONS", "Atlanta")]
    [InlineData("  12   Locations  , Boston", "Boston")]
    public void ParseLocations_Removes_Location_Count_Placeholders(string locationsText, string expected)
    {
        var result = _sut.ParseLocations(locationsText);

        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData("JR123")]
    [InlineData("JR-123")]
    [InlineData("R123")]
    [InlineData("R-123")]
    [InlineData("J123")]
    [InlineData("P123")]
    [InlineData("26WD123")]
    [InlineData("12345")]
    [InlineData("jr-123")]
    public void Extracts_Requisition_Id_From_Path(string requisitionId)
    {
        var result = _sut.ParseRequisitionId($"/job/Atlanta/Software-Engineer_{requisitionId}");

        Assert.Equal(requisitionId, result);
    }

    [Fact]
    public void Removes_Numeric_Suffix_From_Requisition_Id()
    {
        var result = _sut.ParseRequisitionId("/job/Atlanta/Software-Engineer_R-123-1");

        Assert.Equal("R-123", result);
    }

    [Theory]
    [InlineData("/job/Atlanta/Software-Engineer")]
    [InlineData("/job/Atlanta/Software-Engineer_unknown")]
    [InlineData("/job/Atlanta/Software-Engineer_")]
    public void Falls_Back_To_Path_When_Requisition_Id_Is_Unrecognized(string path)
    {
        var result = _sut.ParseRequisitionId(path);

        Assert.Equal(path, result);
    }

    [Theory]
    [InlineData("Posted Today", 0)]
    [InlineData("Posted Yesterday", 1)]
    [InlineData("Posted 2 Days Ago", 2)]
    [InlineData("Posted 15 Days Ago", 15)]
    [InlineData("Posted 30+ Days Ago", null)]
    [InlineData(null, null)]
    [InlineData("", null)]
    [InlineData("Unknown", null)]
    [InlineData("Posted 999999999999999 Days Ago", null)]
    public void Maps_Posted_Age_To_Utc_Date(string? postedOn, int? expectedDaysOld)
    {
        var now = DateTime.UtcNow;

        var result = _sut.MapToPostedDate(postedOn);

        if (expectedDaysOld is null)
        {
            Assert.Null(result);
            return;
        }

        Assert.NotNull(result);
        Assert.Equal(DateTimeKind.Utc, result.Value.Kind);
        Assert.InRange(
            result.Value,
            now.AddDays(-expectedDaysOld.Value).AddSeconds(-1),
            now.AddDays(-expectedDaysOld.Value).AddSeconds(1));
    }
}
