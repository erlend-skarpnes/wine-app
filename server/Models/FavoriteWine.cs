namespace WineApp.Api.Models;

public class FavoriteWine
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public required string Barcode { get; set; }
    public WineData? WineData { get; set; }
    public DateTime AddedAt { get; set; }
}
