namespace WineApp.Api.Models;

public class WineSample
{
    public int Id { get; set; }
    public required string Barcode { get; set; }
    public string? LabelName { get; set; }
    public string? LabelType { get; set; }
    public string[] LabelGrapes { get; set; } = [];
    public string[] LabelPairings { get; set; } = [];
    public string? LabelRegion { get; set; }
    public string? LabelCountry { get; set; }
    public double Confidence { get; set; }
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
