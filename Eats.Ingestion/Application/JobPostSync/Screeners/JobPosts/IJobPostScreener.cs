using System.Text.RegularExpressions;


namespace Eats.Ingestion.Application.JobPostSync.Screeners.JobPosts;


public interface IJobPostScreener
{
    bool ScreenJobPost(IJobPostScreenCriteria value);



    public class TitleScreener: IJobPostScreener
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
            @"\bsoftware\b",
            @"\bdeveloper\b",
            @"\bdevelopment\b",
            @"\bprogrammer\b",
            @"\bbackend\b",
            @"\bback[\s-]?end\b",
            @"\bfrontend\b",
            @"\bfront[\s-]?end\b",
            @"\bfull[\s-]?stack\b",
            @"\bweb\b",
            @"\bapi\b",
            @"\b\.net\b",
            @"\bdotnet\b",
            @"\bc#",
            @"\bcsharp\b",
            @"\basp[\s.]?net\b",
            @"\btypescript\b",
            @"\bjavascript\b",
            @"\bnode[\s.]?js\b",
            @"\breact\b",
            @"\bjava\b",
            @"\bpython\b",
            @"\bai\b",
            @"\bgen[\s-]?ai\b",
            @"\bllm\b",
            @"\bagentic\b",
            @"\bagents?\b",
            @"\bmachine learning\b",
            @"\bml\b",
            @"\brag\b",
            @"\bgenerative\b",
            @"\bplatform\b",
            @"\bapplication\b",
            @"\bapplications\b",
            @"\bintegration\b",
            @"\bcloud\b",
            @"\bdistributed\b",
            @"\binfrastructure\b",
            @"\bautomation\b",
            @"\barchitect\b",
            @"\btechnical staff\b",
            @"\engineer\b");

        private static readonly Regex[] RejectList = CreatePatterns(
            @"\brecruit(?:er|ing|ment)?\b",
            @"\btalent acquisition\b",
            @"\bproject manager\b",
            @"\baccount executive\b",
            @"\baccount manager\b",
            @"\bexecutive assistant\b",
            @"\bassociate director\b",
            @"\bsenior director\b",
            @"\bvice president\b",
            @"\b(?:director|vice president|vp)\b",
            @"\b(?:intern|internship)\b");
            

        public bool ScreenJobPost(IJobPostScreenCriteria job)
        {
            if (RejectList.Any(pattern => pattern.IsMatch(job.Title)))
            {
                return false;
            }

            return AllowList.Any(x => x.IsMatch(job.Title));
        }
    }


    public class LocationScreener : IJobPostScreener
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


        public bool ScreenJobPost(IJobPostScreenCriteria job)
        {
            // Keep null/empty locations since these require further investigation
            if (string.IsNullOrWhiteSpace(job.Location))
            {
                return true;
            }
            
            return AllowList.Any(x => x.IsMatch(job.Location));
        }
    }

    public sealed class UriPathScreener : IJobPostScreener
    {
    private static readonly RegexOptions PatternOptions =
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;
        private static Regex[] CreatePatterns(params string[] patterns)
        {
            return patterns
                .Select(pattern => new Regex(pattern, PatternOptions))
                .ToArray();
        }


        // A known overseas location or a remote role restricted to another US state is not eligible.
        // Deliberately narrow: unknown codes remain eligible for closer inspection.
        private static readonly Regex[] RejectList = CreatePatterns(
            @"\bindia\b",
            @"\bbengaluru\b",
            @"\bbangalore\b",
            @"\bhyderabad\b",
            @"\bpune\b",
            @"\bchennai\b",
            @"\bmumbai\b",
            @"\bgurugram\b",
            @"\bnoida\b",
            @"\bkolkata\b",
            @"\bcoimbatore\b",
            @"\bchina\b",
            @"\bbeijing\b",
            @"\bshanghai\b",
            @"\bphilippines\b",
            @"\btaguig\b",
            @"\bmandaluyong\b",
            @"\bisrael\b",
            @"\bpoland\b",
            @"\bwarsaw\b",
            @"\bkrakow\b",
            @"\bunited-kingdom\b",
            @"\bdublin\b",
            @"\bireland\b",
            @"\baustralia\b",
            @"\bsydney\b",
            @"\bcanberra\b",
            @"\bbrazil\b",
            @"\bsao-paulo\b",
            @"\bbuenos-aires\b",
            @"\bargentina\b",
            @"\bmexico\b",
            @"\bcanada\b",
            @"\bontario\b",
            @"\bgermany\b",
            @"\bmunich\b",
            @"\bvienna\b",
            @"\baustria\b",
            @"\bprague\b",
            @"\bczechia\b",
            @"\blisbon\b",
            @"\bportugal\b",
            @"\bmadrid\b",
            @"\bspain\b",
            @"\bstockholm\b",
            @"\bsweden\b"
        );

        public bool ScreenJobPost(IJobPostScreenCriteria job)
        {
            // Adjust DetailPath here if IJobScreenCriteria uses another property name.
            var path = job.DetailPath;
            if (string.IsNullOrWhiteSpace(path)) return true; // Unresolved, not disqualified.

            return !RejectList.Any(x => x.IsMatch(path));
        }
    }

}