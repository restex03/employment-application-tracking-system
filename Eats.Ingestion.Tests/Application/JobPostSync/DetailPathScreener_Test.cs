
using Xunit;

public sealed class DetailPathScreener_Test
{
    private readonly DetailPathScreener _sut = new();

    [Theory]
    [InlineData("/job/India/Software-Engineer_R123")]
    [InlineData("/job/Bengaluru/Software-Engineer_R123")]
    [InlineData("/job/Bangalore/Software-Engineer_R123")]
    [InlineData("/job/Hyderabad/Software-Engineer_R123")]
    [InlineData("/job/Pune/Software-Engineer_R123")]
    [InlineData("/job/Chennai/Software-Engineer_R123")]
    [InlineData("/job/Mumbai/Software-Engineer_R123")]
    [InlineData("/job/Gurugram/Software-Engineer_R123")]
    [InlineData("/job/Noida/Software-Engineer_R123")]
    [InlineData("/job/Kolkata/Software-Engineer_R123")]
    [InlineData("/job/Coimbatore/Software-Engineer_R123")]
    [InlineData("/job/China/Software-Engineer_R123")]
    [InlineData("/job/Beijing/Software-Engineer_R123")]
    [InlineData("/job/Shanghai/Software-Engineer_R123")]
    [InlineData("/job/Philippines/Software-Engineer_R123")]
    [InlineData("/job/Taguig/Software-Engineer_R123")]
    [InlineData("/job/Mandaluyong/Software-Engineer_R123")]
    [InlineData("/job/Israel/Software-Engineer_R123")]
    [InlineData("/job/Poland/Software-Engineer_R123")]
    [InlineData("/job/Warsaw/Software-Engineer_R123")]
    [InlineData("/job/Krakow/Software-Engineer_R123")]
    [InlineData("/job/United-Kingdom/Software-Engineer_R123")]
    [InlineData("/job/Dublin/Software-Engineer_R123")]
    [InlineData("/job/Ireland/Software-Engineer_R123")]
    [InlineData("/job/Australia/Software-Engineer_R123")]
    [InlineData("/job/Sydney/Software-Engineer_R123")]
    [InlineData("/job/Canberra/Software-Engineer_R123")]
    [InlineData("/job/Brazil/Software-Engineer_R123")]
    [InlineData("/job/Sao-Paulo/Software-Engineer_R123")]
    [InlineData("/job/Buenos-Aires/Software-Engineer_R123")]
    [InlineData("/job/Argentina/Software-Engineer_R123")]
    [InlineData("/job/Mexico/Software-Engineer_R123")]
    [InlineData("/job/Canada/Software-Engineer_R123")]
    [InlineData("/job/Ontario/Software-Engineer_R123")]
    [InlineData("/job/Germany/Software-Engineer_R123")]
    [InlineData("/job/Munich/Software-Engineer_R123")]
    [InlineData("/job/Vienna/Software-Engineer_R123")]
    [InlineData("/job/Austria/Software-Engineer_R123")]
    [InlineData("/job/Prague/Software-Engineer_R123")]
    [InlineData("/job/Czechia/Software-Engineer_R123")]
    [InlineData("/job/Lisbon/Software-Engineer_R123")]
    [InlineData("/job/Portugal/Software-Engineer_R123")]
    [InlineData("/job/Madrid/Software-Engineer_R123")]
    [InlineData("/job/Spain/Software-Engineer_R123")]
    [InlineData("/job/Stockholm/Software-Engineer_R123")]
    [InlineData("/job/Sweden/Software-Engineer_R123")]
    public void Rejects_Known_Overseas_Locations(string path)
    {
        Assert.False(Screen(path));
    }

    [Theory]
    [InlineData("/job/Atlanta/Software-Engineer_R123")]
    [InlineData("/job/Alpharetta/Software-Engineer_R123")]
    [InlineData("/job/Roswell/Software-Engineer_R123")]
    [InlineData("/job/Sandy-Springs/Software-Engineer_R123")]
    [InlineData("/job/Dunwoody/Software-Engineer_R123")]
    [InlineData("/job/Johns-Creek/Software-Engineer_R123")]
    [InlineData("/job/Peachtree-Corners/Software-Engineer_R123")]
    [InlineData("/job/Marietta/Software-Engineer_R123")]
    [InlineData("/job/Georgia/Software-Engineer_R123")]
    [InlineData("/job/United-States/Software-Engineer_R123")]
    [InlineData("/job/Remote/Software-Engineer_R123")]
    [InlineData("/job/Remote-US/Software-Engineer_R123")]
    [InlineData("/job/US-Remote/Software-Engineer_R123")]
    [InlineData("/job/New-York/Software-Engineer_R123")]
    [InlineData("/job/Seattle/Software-Engineer_R123")]
    [InlineData("/job/Unknown-Code/Software-Engineer_R123")]
    [InlineData("/job/Multiple-Locations/Software-Engineer_R123")]
    [InlineData("/job/2-Locations/Software-Engineer_R123")]
    public void Allows_Locations_Not_In_FailList(string path)
    {
        Assert.True(Screen(path));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData(" ")]
    [InlineData("\t")]
    [InlineData("\r\n")]
    public void Allows_Missing_Or_Whitespace_Paths(string? path)
    {
        Assert.True(Screen(path));
    }

    [Theory]
    [InlineData("/job/INDIA/Software-Engineer_R123")]
    [InlineData("/job/india/Software-Engineer_R123")]
    [InlineData("/job/InDiA/Software-Engineer_R123")]
    [InlineData("/job/STOCKHOLM/Software-Engineer_R123")]
    [InlineData("/job/buenos-aires/Software-Engineer_R123")]
    public void Rejects_Locations_Case_Insensitively(string path)
    {
        Assert.False(Screen(path));
    }

    [Theory]
    [InlineData("/job/Indiana/Software-Engineer_R123")]
    [InlineData("/job/Indianapolis/Software-Engineer_R123")]
    [InlineData("/job/Indian-Trail/Software-Engineer_R123")]
    [InlineData("/job/New-London-Countywide/Software-Engineer_R123")]
    [InlineData("/job/PolandSpring/Software-Engineer_R123")]
    [InlineData("/job/Canadaway/Software-Engineer_R123")]
    public void Does_Not_Match_Partial_Words(string path)
    {
        Assert.True(Screen(path));
    }


    [Theory]
    [InlineData("/job/India-Remote/Software-Engineer_R123")]
    [InlineData("/job/Remote-India/Software-Engineer_R123")]
    [InlineData("/job/Atlanta-India/Software-Engineer_R123")]
    [InlineData("/job/US-Canada/Software-Engineer_R123")]
    [InlineData("/job/Atlanta/India-Operations-Engineer_R123")]
    [InlineData("/job/Remote/Canada-Payroll-Engineer_R123")]
    [InlineData("/job/Georgia/Software-Engineer-Poland-Team_R123")]
    public void Rejects_When_Any_FailList_Location_Is_Present(
        string path)
    {
        Assert.False(Screen(path));
    }

    private bool Screen(string? detailPath)
    {
        return _sut.IsSatisfiedBy(
            new TestJobScreenCriteria
            {
                DetailPath = detailPath!
            });
    }

    // Replace with your concrete IJobScreenCriteria implementation
    // if the interface contains additional required members.
    private sealed class TestJobScreenCriteria : IJobScreenCriteria
    {
        public string DetailPath { get; init; } = string.Empty;
        public string? Location { get; init; } = null;
        public string Title { get; init; } = string.Empty;
    }
}
