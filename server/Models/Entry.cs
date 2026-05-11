namespace WineApp.Api.Models;

public class Entry
{
    public int Id { get; set; }
    public int HomeId { get; set; }
    public int? LocationId { get; set; }
    public required string Barcode { get; set; }
    public int Quantity { get; set; }
    public int? SectionId { get; set; }
    public Home Home { get; set; } = null!;
    public Location? Location { get; set; }
    public Section? Section { get; set; }
}
