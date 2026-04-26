namespace WineApp.Api.Models;

public class CellarEntry
{
    public required string UserId { get; set; }
    public required string Barcode { get; set; }
    public int Quantity { get; set; }
}
