namespace WineApp.Api.Models;

public class Wine
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Winery { get; set; }
    public int? Vintage { get; set; }
    public required string Varietal { get; set; }
    public string Region { get; set; } = "";
    public string Country { get; set; } = "";
    public string? Description { get; set; }
    public string? LabelImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CellarEntry> CellarEntries { get; set; } = [];
}
