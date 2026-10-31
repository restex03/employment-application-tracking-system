using Eats.Ingestion.Application.JobPostDiscovery;
using Eats.Ingestion.Application.JobPostSync;

namespace Eats.Ingestion.Tests.Application.JobPostSync;

public sealed class JobPostScreenerTests
{
    [Fact]
    public void ScreenJobPost_ReturnsTrueWhenAllScreenersAcceptThePost()
    {
        var criteria = new JobCriteria();
        var sut = new JobScreenService(
        [
            new TestScreener(true),
            new TestScreener(true),
        ]);

        Assert.True(sut.IsSatisfiedBy(criteria));
    }

    [Fact]
    public void ScreenJobPost_ReturnsFalseWhenAnyScreenerRejectsThePost()
    {
        var criteria = new JobCriteria();
        var acceptingScreener1 = new TestScreener(true);
        var rejectingScreener = new TestScreener(false);
        var acceptingScreener2 = new TestScreener(true);
        var sut = new JobScreenService(
        [
            acceptingScreener1,
            rejectingScreener,
            acceptingScreener2,
        ]);

        Assert.False(sut.IsSatisfiedBy(criteria));
    }

    private sealed class TestScreener(bool result) : IJobPostScreener
    {
        public bool IsSatisfiedBy(IJobPostScreenCriteria value) => result;
    }

    private sealed class JobCriteria : IJobPostScreenCriteria
    {
        public string Location => "NO_OP";

        public string Title => "NO_OP";
        public string DetailPath => "NO_OP";
    }
}
