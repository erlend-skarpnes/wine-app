using System.Net.Http.Json;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

// --- Public result types ---

public class WineIdentifyResult
{
    public string? WineId { get; init; }
    public double Confidence { get; init; }
    public WineSuggestion[] Suggestions { get; init; } = [];
}

public class WineSuggestion
{
    public required string Id { get; init; }
    public string? Name { get; init; }
    public string? Type { get; init; }
    public string? Winery { get; init; }
    public string? Region { get; init; }
    public string? Country { get; init; }
}

// --- Private raw API response DTOs ---

file record IdentifyResponse(
    string SubmissionId,
    double Confidence,
    IdentifyWine? Wine,
    IdentifySuggestion[]? Suggestions
);

file record IdentifyWine(
    string Id,
    string? Name,
    string? Type,
    string? Winery,
    string? Region,
    string? Country,
    double? AverageRating
);

file record IdentifySuggestion(
    string Id,
    string? Name,
    string? Type,
    string? Winery,
    string? Region,
    string? Country,
    double? AverageRating
);

file record WineDetailResponse(
    string Id,
    string Name,
    string? Type,
    string? Body,
    string? Acidity,
    double? AlcoholContent,
    string? Description,
    string? ImageUrl,
    double? AverageRating,
    int? RatingsCount,
    WineDetailWinery? Winery,
    WineDetailRegion? Region,
    WineDetailGrape[]? Grapes,
    WineDetailPairing[]? Pairings
);

file record WineDetailWinery(string Id, string Name);
file record WineDetailRegion(string Id, string Name, string? Country);
file record WineDetailGrape(string Id, string Name, string? Color);
file record WineDetailPairing(string Food, double? Confidence, string? Notes);

// --- Service ---

public class WineApiService(HttpClient http)
{
    private const double ConfidenceThreshold = 0.8;

    public async Task<WineIdentifyResult> IdentifyAsync(
        Stream imageStream, string contentType, CancellationToken ct = default)
    {
        using var content = new MultipartFormDataContent();
        var imageContent = new StreamContent(imageStream);
        imageContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(contentType);
        content.Add(imageContent, "image", "label.jpg");

        var response = await http.PostAsync("identify/image", content, ct);
        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<IdentifyResponse>(ct)
            ?? throw new InvalidOperationException("Empty response from identify endpoint");

        if (result.Confidence >= ConfidenceThreshold && result.Wine?.Id is not null)
        {
            return new WineIdentifyResult
            {
                WineId = result.Wine.Id,
                Confidence = result.Confidence,
            };
        }

        var suggestions = result.Suggestions?
            .Select(s => new WineSuggestion
            {
                Id = s.Id,
                Name = s.Name,
                Type = s.Type,
                Winery = s.Winery,
                Region = s.Region,
                Country = s.Country,
            })
            .ToArray() ?? [];

        return new WineIdentifyResult
        {
            Confidence = result.Confidence,
            Suggestions = suggestions,
        };
    }

    public async Task<WineData> GetDetailAsync(
        string wineApiId, string barcode, CancellationToken ct = default)
    {
        var detail = await http.GetFromJsonAsync<WineDetailResponse>($"wines/{wineApiId}", ct)
            ?? throw new InvalidOperationException($"No detail returned for wine {wineApiId}");

        return new WineData
        {
            Barcode = barcode,
            ProductCode = detail.Id,
            Name = detail.Name,
            Type = detail.Type,
            Winery = detail.Winery?.Name,
            Region = detail.Region?.Name,
            Country = detail.Region?.Country,
            Body = detail.Body,
            Acidity = detail.Acidity,
            AlcoholContent = detail.AlcoholContent,
            Description = detail.Description,
            ImageUrl = detail.ImageUrl,
            Grapes = detail.Grapes?.Select(g => g.Name).ToArray() ?? [],
            Pairings = detail.Pairings?.Select(p => p.Food).ToArray() ?? [],
        };
    }
}
