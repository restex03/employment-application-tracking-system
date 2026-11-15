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
    public void NextRun_DoesNotSkipSpringForwardIngestion()
    {
        // At 02:00 on 2026-03-08, Eastern clocks jump to 03:00; run at 03:00 that day.
        var now = new DateTimeOffset(2026, 3, 8, 5, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(2, 30), Eastern);

        Assert.Equal(new DateTime(2026, 3, 8, 7, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_SpringForwardWithSecondsRunsAtFirstValidMinute()
    {
        var now = new DateTimeOffset(2026, 3, 8, 6, 59, 59, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(2, 30, 45), Eastern);

        Assert.Equal(new DateTime(2026, 3, 8, 7, 0, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_SpringForwardDoesNotRunTwiceOnSameDay()
    {
        // 03:00 EDT is the replacement for today's nonexistent 02:30 time.
        // After that instant, schedule tomorrow rather than running twice.
        var now = new DateTimeOffset(2026, 3, 8, 7, 0, 1, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(2, 30), Eastern);

        Assert.Equal(new DateTime(2026, 3, 9, 6, 30, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_SpringForwardDoesNotShiftValidLocalTime()
    {
        var now = new DateTimeOffset(2026, 3, 8, 5, 0, 0, TimeSpan.Zero);

        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(3, 30), Eastern);

        Assert.Equal(new DateTime(2026, 3, 8, 7, 30, 0, DateTimeKind.Utc), next);
    }

    [Fact]
    public void NextRun_DoesNotSkipSecondFallBackOccurrenceAfterFirst()
    {
        // 01:45 EDT occurs before 01:30 EST in absolute time.
        var now = new DateTimeOffset(2026, 11, 1, 5, 45, 0, TimeSpan.Zero);
        var next = JobSynchronizerTaskScheduler.GetNextRunUtc(
            now, new TimeOnly(1, 30), Eastern);

        Assert.Equal(new DateTime(2026, 11, 1, 6, 30, 0, DateTimeKind.Utc), next);
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
