namespace WineApp.Api.Models;

public class Entry
{
    public int LocationId { get; set; }
    public required string Barcode { get; set; }
    public int Quantity { get; set; }
    public int? SectionId { get; set; }
    public Location Location { get; set; } = null!;
    public Section? Section { get; set; }
}
