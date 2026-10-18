using System.Text.RegularExpressions;
using Eats.Ingestion.Application.JobPostDiscovery;

namespace Eats.Ingestion.Application.JobPostSync;

public sealed class JobPostScreener : IJobPostScreener
{
    private static readonly RegexOptions PatternOptions =
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;

    private static readonly Regex[] PassList = CreatePatterns(
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

    private static readonly Regex[] FailRoles = CreatePatterns(
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

    private static readonly Regex[] FailPlaces = CreatePatterns(
        @"\bindia\b",
        @"\btaiwan\b",
        @"\bchina\b",
        @"\bhong kong\b",
        @"\b(?:macau|macao)\b",
        @"\bpakistan\b",
        @"\bbangladesh\b",
        @"\bsri lanka\b",
        @"\bnepal\b",
        @"\bsingapore\b",
        @"\bmalaysia\b",
        @"\bindonesia\b",
        @"\bphilippines\b",
        @"\bvietnam\b",
        @"\bthailand\b",
        @"\bjapan\b",
        @"\b(?:south korea|republic of korea)\b",
        @"\bbengaluru\b",
        @"\bbangalore\b",
        @"\btrivandrum\b",
        @"\bmumbai\b",
        @"\bcanada\b",
        @"\bireland\b",
        @"\bpuerto rico\b",
        @"\bmexico\b",
        @"\bbulgaria\b"
    );

    private static Regex[] CreatePatterns(params string[] patterns)
    {
        return patterns
            .Select(pattern => new Regex(pattern, PatternOptions))
            .ToArray();
    }

    public bool ScreenJobPost(JobPostDiscoveryRecord jobPost)
    {
        if (FailRoles.Any(pattern => pattern.IsMatch(jobPost.Title))) {
            return false;
        }
        if (FailPlaces.Any(pattern => pattern.IsMatch(jobPost.Title)
            || pattern.IsMatch(jobPost.DetailPath) )) {
            return false;
        }


        return PassList.Any(pattern => pattern.IsMatch(jobPost.Title));
    }
}
