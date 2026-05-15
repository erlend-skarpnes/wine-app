namespace WineApp.Api.Models;

public class DrinkLog
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int HomeId { get; set; }
    public Home Home { get; set; } = null!;
    public required string Barcode { get; set; }
    public WineData? WineData { get; set; }
    public int Quantity { get; set; }
    public DateTime DrankAt { get; set; }
}
