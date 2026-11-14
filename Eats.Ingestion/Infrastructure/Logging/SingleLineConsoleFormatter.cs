using System.Globalization;
using Serilog.Events;
using Serilog.Formatting;

namespace Eats.Ingestion.Infrastructure.Logging;

/// <summary>
/// Human-friendly, single-line console output. OTLP still receives the original structured
/// log event, including the complete exception and all its properties.
/// </summary>
public sealed class SingleLineConsoleFormatter : ITextFormatter
{
    public void Format(LogEvent logEvent, TextWriter output)
    {
        var timestamp = logEvent.Timestamp.UtcDateTime.ToString(
            "yyyy-MM-ddTHH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

        var level = logEvent.Level switch
        {
            LogEventLevel.Verbose => "VRB",
            LogEventLevel.Debug => "DBG",
            LogEventLevel.Information => "INF",
            LogEventLevel.Warning => "WRN",
            LogEventLevel.Error => "ERR",
            LogEventLevel.Fatal => "FTL",
            _ => "UNK"
        };

        var source = GetProperty(logEvent, "SourceContext");
        if (source is not null)
        {
            source = source[(source.LastIndexOf('.') + 1)..];
        }

        output.Write(timestamp);
        output.Write(" [");
        output.Write(level);
        output.Write("] [");
        output.Write(source ?? "Application");
        output.Write("] ");

        WriteSingleLine(output, logEvent.RenderMessage(CultureInfo.InvariantCulture));

        WriteContext(output, logEvent, "SyncBatchId", "batch");
        WriteContext(output, logEvent, "QueueTaskId", "task");
        WriteContext(output, logEvent, "RunId", "run");

        if (logEvent.Exception is { } exception)
        {
            output.Write(" | ");
            output.Write(exception.GetType().Name);
            output.Write(": ");
            WriteSingleLine(output, exception.Message);
        }

        output.WriteLine();
    }

    private static void WriteContext(
        TextWriter output, LogEvent logEvent, string property, string label)
    {
        var value = GetProperty(logEvent, property);
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        output.Write(" | ");
        output.Write(label);
        output.Write('=');
        WriteSingleLine(output, value);
    }

    private static string? GetProperty(LogEvent logEvent, string name)
    {
        if (!logEvent.Properties.TryGetValue(name, out var property))
        {
            return null;
        }

        return property is ScalarValue { Value: { } value }
            ? Convert.ToString(value, CultureInfo.InvariantCulture)
            : property.ToString();
    }

    private static void WriteSingleLine(TextWriter output, string message)
    {
        // Escape embedded line breaks so one log event always produces one console line.
        output.Write(message.Replace("\r", "\\r").Replace("\n", "\\n"));
    }
}
