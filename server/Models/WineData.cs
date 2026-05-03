namespace WineApp.Api.Models;

public class WineData
{
    public required string Barcode { get; set; }
    public required string ProductCode { get; set; }
    public required string Name { get; set; }
    public string? Vintage { get; set; }
    public string? Type { get; set; }
    public string? Winery { get; set; }
    public string? Region { get; set; }
    public string? Country { get; set; }
    public string? Body { get; set; }
    public string? Acidity { get; set; }
    public string? Tannins { get; set; }
    public double? AlcoholContent { get; set; }
    public string? Description { get; set; }
    public string? ImageUrl { get; set; }
    public string[] Grapes { get; set; } = [];
    public string[] Pairings { get; set; } = [];
    public string? StoragePotential { get; set; }
    public bool Refetch { get; set; } = false;
}
