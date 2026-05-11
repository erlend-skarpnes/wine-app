namespace WineApp.Api.Models;

public class Location
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int HomeId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Home Home { get; set; } = null!;
    public ICollection<Section> Sections { get; set; } = [];
    public ICollection<Entry> Entries { get; set; } = [];
}
