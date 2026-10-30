using System.Text.RegularExpressions;
using Eats.Ingestion.Infrastructure.JobSources.Workday;

public interface IWorkdayParser
{
    DateTime? MapToPostedDate(string? postedOn);
    string? ParseLocations(string? locationsText);
    string? ParseRequisitionId(string? input);


    public class Imp : IWorkdayParser
    {
        public string? ParseRequisitionId(string? input)
        {
            var tail = input?.Split('_').LastOrDefault();
            var match = tail is null ? null : WorkdayRegexCompileTimeHelpers.RequisitionIdRegex().Match(tail);
            var requisitionId = match is { Success: true } ? match.Groups[1].Value : input;
            return requisitionId;
        }


        public DateTime? MapToPostedDate(string? postedOn)
        {
            return NormalizePostedDate(postedOn);
        }
        private static int? NormalizeDaysOld(string? postedOn)
        {
            if (string.IsNullOrWhiteSpace(postedOn))
            {
                return null;
            }

            if (postedOn is "Posted Today")
            {
                return 0;
            }

            if (postedOn is "Posted Yesterday")
            {
                return 1;
            }

            if (postedOn.Contains("30+ Days Ago", StringComparison.Ordinal))
            {
                return null;
            }

            
            var match = DaysAgoRegex.Match(postedOn);
            if (match.Success && int.TryParse(match.Groups[1].Value, out var days))
            {
                return days;
            }        

            return null;
        }

        public string? ParseLocations(string? locationsText)
        {
            if (string.IsNullOrWhiteSpace(locationsText))
                return null;

            var locations = locationsText
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(x => !WorkdayRegexCompileTimeHelpers.LocationsRegex().IsMatch(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToArray();

            return locations.Length > 0
                ? string.Join(", ", locations)
                : null;
        }

        private static DateTime? NormalizePostedDate(string? postedOn)
        {
            var daysOld = NormalizeDaysOld(postedOn);
            return daysOld.HasValue ? DateTime.UtcNow.AddDays(-daysOld.Value) : null;
        }
 
        private static readonly Regex DaysAgoRegex = WorkdayRegexCompileTimeHelpers.DaysAgoRegex();


    }
}