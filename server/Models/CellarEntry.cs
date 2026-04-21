namespace WineApp.Api.Models;

public class CellarEntry
{
    public int Id { get; set; }
    public int WineId { get; set; }
    public Wine Wine { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal? PurchasePrice { get; set; }
    public DateOnly? PurchasedAt { get; set; }
    public int? DrinkFrom { get; set; }
    public int? DrinkUntil { get; set; }
    public string? Location { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
