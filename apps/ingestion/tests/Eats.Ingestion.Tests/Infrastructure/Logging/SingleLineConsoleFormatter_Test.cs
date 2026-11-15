using Eats.Ingestion.Infrastructure.Logging;
using Serilog.Events;
using Serilog.Parsing;

namespace Eats.Ingestion.Tests.Infrastructure.Logging;

public sealed class SingleLineConsoleFormatter_Test
{
    [Fact]
    public void Format_UsesUtcAndKeepsMessageAndExceptionOnOneLine()
    {
        var formatter = new SingleLineConsoleFormatter();
        var logEvent = new LogEvent(
            new DateTimeOffset(2026, 11, 14, 15, 30, 0, TimeSpan.FromHours(-5)),
            LogEventLevel.Error,
            new InvalidOperationException("failure\nwith details"),
            new MessageTemplateParser().Parse("Sync failed for {JobSource}"),
            new[]
            {
                new LogEventProperty("JobSource", new ScalarValue("Example")),
                new LogEventProperty("SourceContext", new ScalarValue("Eats.Ingestion.HostedServices.JobSynchronizer")),
                new LogEventProperty("SyncBatchId", new ScalarValue("batch-123"))
            });

        using var writer = new StringWriter();
        formatter.Format(logEvent, writer);
        var output = writer.ToString();

        Assert.StartsWith("2026-11-14T20:30:00.000Z [ERR] [JobSynchronizer]", output);
        Assert.Contains("Sync failed for \"Example\"", output);
        Assert.Contains("batch=batch-123", output);
        Assert.Contains(@"InvalidOperationException: failure\nwith details", output);
        Assert.Single(output.Split('\n', StringSplitOptions.RemoveEmptyEntries));
    }
}
