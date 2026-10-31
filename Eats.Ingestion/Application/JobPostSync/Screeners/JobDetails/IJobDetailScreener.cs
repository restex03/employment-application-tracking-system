using System.Text.RegularExpressions;


namespace Eats.Ingestion.Application.JobPostSync.Screeners.JobDetails;
public interface IJobDetailScreener
{
    bool ScreenJobDetail(IJobDetailScreenCriteria value);



    public class LocationScreener : IJobDetailScreener
    {

        private static readonly RegexOptions PatternOptions =
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;
        private static Regex[] CreatePatterns(params string[] patterns)
        {
            return patterns
                .Select(pattern => new Regex(pattern, PatternOptions))
                .ToArray();
        }
            
        private static readonly Regex[] AllowList = CreatePatterns(
            // Atlanta and surrounding metro areas
            @"\batlanta\b",
            @"\balpharetta\b",
            @"\broswell\b",
            @"\bsandy[\s-]+springs\b",
            @"\bdunwoody\b",
            @"\bjohns[\s-]+creek\b",
            @"\bpeachtree[\s-]+corners\b",
            @"\bnorcross\b",
            @"\bduluth\b",
            @"\bsuwanee\b",
            @"\bmarietta\b",
            @"\bsmyrna\b",
            @"\bkennesaw\b",
            @"\bwoodstock\b",
            @"\bcumming\b",
            @"\bmilton\b",
            @"\bchamblee\b",
            @"\bdoraville\b",
            @"\bbrookhaven\b",
            @"\btucker\b",
            @"\bvinings\b",
            @"\bacworth\b",
            @"\b(?:east|south)\s+cobb\b",
            @"\b(?:gwinnett|cobb|fulton|dekalb|forsyth)\s+county\b",

            // Atlanta location identifiers
            @"\bATL\d*\b",
            @"\bGA[\s-]+Atlanta\b",
            @"\bUS[A]?[\s,-]+GA[\s,-]+(?:Atlanta|Alpharetta)\b",

            // US-wide remote opportunities
            @"\bremote[\s,/-]*(?:US|USA|United States|Nationwide)\b",
            @"\b(?:US|USA|United States(?: of America)?|Nationwide)[\s,/-]*remote\b",
            @"\bremote\s*\(\s*US\s+only\s*\)",
            @"\bremote[\s,-]+anywhere[\s,-]+(?:in\s+)?(?:US|USA)\b",
            @"\bany\s+location\s*/\s*remote\b",
            @"\bremote\s*/\s*teleworker\s+US\b",
            @"\bremote\s+nationwide\b",
            @"^\s*remote\s+work(?:er)?\s*$",
            @"^\s*home[\s-]?based\s*$",
            @"^\s*telecommut(?:e|ing)\s*$",
            @"^\s*work\s+from\s+home\s*$",
            @"\bwork\s+from\s+home[\s,/-]*(?:US|USA|United States(?:\s+of\s+America)?)\b",
            // Remote without geographic restrictions specified
            @"^\s*remote\s*$",
            @"^\s*remote\s*[-/]\s*remote\s*$",

            // Georgia-based remote opportunities
            @"\b(?:Georgia|GA)[\s,/-]+remote\b",
            @"\bremote[\s,/-]+(?:Georgia|GA)\b",

            // Ambiguous US locations requiring further inspection
            @"^\s*(?:US|USA|United States(?: of America)?)\s*$",
            @"^\s*(?:Georgia|GA)\s*$",

            // Multiple locations hidden by Workday
            @"^\s*\d+\s+locations?\s*$",

            // Missing or unspecified location
            @"^\s*(?:NULL|N/A|NA|Unknown|Unspecified|TBD|Not Specified)\s*$"
        );


        public bool ScreenJobDetail(IJobDetailScreenCriteria job)
        {
            // Keep null/empty locations since these require further investigation
            if (job.Locations is null)
            {
                return true;
            }
            var cities = job.Locations
                .Select( x=> x.City)
                .OfType<string>()
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToArray();
            
            var states = job.Locations
                .Select(x => x.State)
                .OfType<string>()
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct()
                .ToArray();

            var combined = cities.Concat(states);
            return AllowList.Any(x => x.IsMatch(string.Join(";", combined)));
        }
    }
}

