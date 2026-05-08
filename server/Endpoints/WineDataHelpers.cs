namespace WineApp.Api.Endpoints;

public static class WineDataHelpers
{
    // "Malbec 40%" → "Malbec"  |  "Cabernet Sauvignon" → "Cabernet Sauvignon"
    public static string StripGrapePercentage(string grape)
    {
        var parts = grape.Split(' ');
        return parts.Length > 1 && parts[^1].EndsWith('%')
            ? string.Join(' ', parts[..^1])
            : grape;
    }
}
