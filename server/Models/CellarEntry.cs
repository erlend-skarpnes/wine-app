namespace WineApp.Api.Models;

public class CellarEntry
{
    public int CellarId { get; set; }
    public required string Barcode { get; set; }
    public int Quantity { get; set; }
    public Cellar Cellar { get; set; } = null!;
}
