using Eats.Ingestion.Application.JobPostDiscovery;

namespace Eats.Ingestion.Tests.Application.JobPostSync;

public sealed class RolesScreenerTests
{
    [Theory]
    [InlineData("Software Engineer")]
    [InlineData("Backend Developer")]
    [InlineData("Front-End Engineer")]
    [InlineData("Full Stack Developer")]
    [InlineData("C# Developer")]
    [InlineData("AI/ML Engineer")]
    [InlineData("Platform Engineer")]
    public void RolePassList_AllowsTechnicalTitles(string title)
    {
        var sut = new RolesScreener();

        Assert.True(sut.IsSatisfiedBy(new JobCriteria(title)));
    }

    [Theory]
    [InlineData("Product Designer")]
    [InlineData("Data Analyst")]
    [InlineData("Recruiter")]
    public void RolePassList_RejectsUnmatchedTitles(string title)
    {
        var sut = new RolesScreener();

        Assert.False(sut.IsSatisfiedBy(new JobCriteria(title)));
    }

    [Theory]
    [InlineData("Software Recruiter")]
    [InlineData("AI Project Manager")]
    [InlineData("Software Engineering Intern")]
    [InlineData("Vice President of Engineering")]
    public void RoleFailList_RejectsTitlesEvenWhenTheyMatchPassList(string title)
    {
        var sut = new RolesScreener();

        Assert.False(sut.IsSatisfiedBy(new JobCriteria(title)));
    }

    private sealed class JobCriteria(string title) : IJobScreenCriteria
    {
        public string Location { get; } = "NO_OP";

        public string Title { get; } = title;

        public string DetailPath { get; } = "NO_OP";
    }
}
