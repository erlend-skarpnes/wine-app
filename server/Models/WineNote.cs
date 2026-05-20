namespace WineApp.Api.Models;

public class WineNote
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public required string Barcode { get; set; }
    public WineData? WineData { get; set; }
    public int? DrinkFromYear { get; set; }
    public int? DrinkToYear { get; set; }
    public string? PersonalNote { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
