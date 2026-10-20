using System.Text.RegularExpressions;

public class RolesScreener: IScreener
{
    private static readonly RegexOptions PatternOptions =
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant | RegexOptions.Compiled;
    private static Regex[] CreatePatterns(params string[] patterns)
    {
        return patterns
            .Select(pattern => new Regex(pattern, PatternOptions))
            .ToArray();
    }

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

    private static readonly Regex[] FailList = CreatePatterns(
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
        

    public bool IsSatisfiedBy(IJobScreenCriteria job)
    {
        if (FailList.Any(pattern => pattern.IsMatch(job.Title)))
        {
            return false;
        }

        return PassList.Any(x => x.IsMatch(job.Title));
    }
}