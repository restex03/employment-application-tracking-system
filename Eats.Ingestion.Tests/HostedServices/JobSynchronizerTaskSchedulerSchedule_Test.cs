using Eats.Ingestion.HostedServices;

namespace Eats.Ingestion.Tests.HostedServices;

public sealed class JobSynchronizerTaskSchedulerSchedule_Test
{
    private static readonly TimeZoneInfo Eastern =
        TimeZoneInfo.FindSystemTimeZoneById("America/New_York");

    [Fact]
    public void NextRun_UsesEasternTimeDuringDaylightSavingTime()
    {
        var now = new DateTimeOffset(2026, 7, 1, 12, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(5, 0), Eastern);

        Assert.Equal(new DateTime(2026, 7, 2, 9, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_UsesEasternTimeDuringStandardTime()
    {
        var now = new DateTimeOffset(2026, 12, 1, 12, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(5, 0), Eastern);

        Assert.Equal(new DateTime(2026, 12, 2, 10, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_SkipsNonexistentSpringForwardLocalTime()
    {
        // At 02:00 on 2026-03-08, Eastern clocks jump forward to 03:00.
        var now = new DateTimeOffset(2026, 3, 8, 5, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(2, 30), Eastern);

        Assert.Equal(new DateTime(2026, 3, 8, 7, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_UsesStandardTimeForAmbiguousFallBackLocalTime()
    {
        // 01:30 occurs twice on 2026-11-01; schedule only the standard-time occurrence.
        var now = new DateTimeOffset(2026, 11, 1, 4, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(1, 30), Eastern);

        Assert.Equal(new DateTime(2026, 11, 1, 6, 30, 0, DateTimeKind.Utc), next);
    }
}
