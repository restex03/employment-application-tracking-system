using System.Text.RegularExpressions;

public sealed class DetailPathScreener : IScreener
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

    public bool IsSatisfiedBy(IJobScreenCriteria job)
    {
        // Adjust DetailPath here if IJobScreenCriteria uses another property name.
        var path = job.DetailPath;
        if (string.IsNullOrWhiteSpace(path)) return true; // Unresolved, not disqualified.

        return !RejectList.Any(x => x.IsMatch(path));
    }
}
