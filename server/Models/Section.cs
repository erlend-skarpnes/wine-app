namespace WineApp.Api.Models;

public class Section
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int LocationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Location Location { get; set; } = null!;
    public ICollection<Entry> Entries { get; set; } = [];
}
