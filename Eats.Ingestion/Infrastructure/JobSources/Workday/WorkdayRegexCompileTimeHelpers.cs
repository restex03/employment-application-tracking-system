
using System.Text.RegularExpressions;

namespace Eats.Ingestion.Infrastructure.JobSources.Workday;

internal sealed partial class WorkdayRegexCompileTimeHelpers
{
    [GeneratedRegex(@"^Posted (\d+) Days Ago$")]
    internal static partial Regex DaysAgoRegex();

    [GeneratedRegex(@"^(JR-?\d+|R-?\d+|J\d+|P\d+|\d{2}WD\d+|\d+)(?:-\d+)?$", RegexOptions.IgnoreCase)]
    internal static partial Regex RequisitionIdRegex();

    [GeneratedRegex(@"<(h[1-5])(\b[^>]*)>([\s\S]*?)</\1>", RegexOptions.IgnoreCase)]
    internal static partial Regex HeadingRegex();

    [GeneratedRegex(@"</?(?:b|strong)\b[^>]*>", RegexOptions.IgnoreCase)]
    internal static partial Regex BoldTagRegex();
}