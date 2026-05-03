using System.Net.Http.Json;
using System.Text.Json.Serialization;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

// --- DTOs matching the actual Vinmonopolet API response shapes ---

internal class VmpBarcodeResult
{
    public string? Code { get; set; }
    public string? Name { get; set; }
}

internal class VmpProductDetail
{
    public string? Code { get; set; }
    public string? Name { get; set; }
    public string? Year { get; set; }
    public string? Description { get; set; }

    [JsonPropertyName("main_category")]
    public VmpCategory? MainCategory { get; set; }

    [JsonPropertyName("main_country")]
    public VmpCategory? MainCountry { get; set; }

    [JsonPropertyName("main_producer")]
    public VmpCategory? MainProducer { get; set; }

    public VmpCategory? District { get; set; }
    public VmpImage[]? Images { get; set; }
    public VmpContent? Content { get; set; }
}

internal class VmpCategory
{
    public string? Name { get; set; }
}

internal class VmpImage
{
    public string? Format { get; set; }
    public string? Url { get; set; }
}

internal class VmpContent
{
    [JsonPropertyName("isGoodFor")]
    public VmpPairing[]? IsGoodFor { get; set; }

    public VmpIngredient[]? Ingredients { get; set; }

    public VmpTrait[]? Traits { get; set; }

    public VmpCharacteristic[]? Characteristics { get; set; }

    public VmpStoragePotential? StoragePotential { get; set; }
}

internal class VmpStoragePotential
{
    public string? FormattedValue { get; set; }
}

internal class VmpPairing
{
    public string? Code { get; set; }
    public string? Name { get; set; }
}

internal class VmpIngredient
{
    // e.g. "Malbec 40%" — grape name followed by percentage
    public string? FormattedValue { get; set; }
}

internal class VmpTrait
{
    public string? Name { get; set; }
    // e.g. "14,3%"
    public string? FormattedValue { get; set; }
}

internal class VmpCharacteristic
{
    public string? Name { get; set; }
    // numeric string 0-12
    public string? Value { get; set; }
}

// --- Service ---

public class VinmonopoletService(HttpClient http)
{
    /// <summary>Returns null when the barcode is not found or the API is unreachable.</summary>
    public async Task<WineData?> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
    {
        try
        {
            // Step 1: resolve barcode → product code via v2
            var hit = await http.GetFromJsonAsync<VmpBarcodeResult>(
                $"vmpws/v2/vmp/products/barCodeSearch/{Uri.EscapeDataString(barcode)}?fields=FULL", ct);

            if (hit?.Code is null)
                return null;

            // Step 2: fetch full details via v3
            var detail = await http.GetFromJsonAsync<VmpProductDetail>(
                $"vmpws/v3/vmp/products/{hit.Code}?fields=FULL", ct);

            if (detail is null)
                return null;

            return Map(detail, barcode);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }

    private static WineData Map(VmpProductDetail p, string barcode) => new()
    {
        Barcode        = barcode,
        ProductCode    = p.Code ?? barcode,
        Name           = p.Name ?? barcode,
        Vintage        = string.IsNullOrWhiteSpace(p.Year) ? null : p.Year,
        Type           = p.MainCategory?.Name,
        Winery         = p.MainProducer?.Name,
        Region         = p.District?.Name,
        Country        = p.MainCountry?.Name,
        AlcoholContent = ParseAlcohol(p.Content?.Traits),
        Description    = string.IsNullOrWhiteSpace(p.Description) ? null : p.Description,
        ImageUrl       = p.Images?
            .FirstOrDefault(i => i.Format == "product")?.Url
            ?? p.Images?.FirstOrDefault()?.Url,
        Grapes         = p.Content?.Ingredients?
            .Select(i => i.FormattedValue)
            .Where(s => s is not null)
            .Select(s => s!)
            .ToArray() ?? [],
        Pairings       = p.Content?.IsGoodFor?
            .Where(x => x.Name is not null)
            .Select(x => x.Name!)
            .ToArray() ?? [],
        Body             = FindCharacteristic(p.Content?.Characteristics, "Fylde"),
        Acidity          = FindCharacteristic(p.Content?.Characteristics, "Friskhet"),
        StoragePotential = p.Content?.StoragePotential?.FormattedValue,
    };

    // "14,3%" → 14.3  |  null → null
    private static double? ParseAlcohol(VmpTrait[]? traits)
    {
        var raw = traits?.FirstOrDefault(t => t.Name == "Alkohol")?.FormattedValue;
        if (raw is null) return null;
        var cleaned = raw.TrimEnd('%').Replace(',', '.');
        return double.TryParse(cleaned,
            System.Globalization.NumberStyles.Any,
            System.Globalization.CultureInfo.InvariantCulture,
            out var val) ? val : null;
    }

    // "Malbec 40%" → "Malbec"  |  "Cabernet Sauvignon 45%" → "Cabernet Sauvignon"
    private static string? StripPercentage(string? value)
    {
        if (value is null) return null;
        var parts = value.Split(' ');
        return parts.Length > 1
            ? string.Join(' ', parts[..^1])
            : value;
    }

    // Returns "9/12" for a named characteristic, or null if not found
    private static string? FindCharacteristic(VmpCharacteristic[]? chars, string name)
    {
        var val = chars?.FirstOrDefault(c => c.Name == name)?.Value;
        return val is not null ? $"{val}/12" : null;
    }
}
