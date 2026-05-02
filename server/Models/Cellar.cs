namespace WineApp.Api.Models;

public class Cellar
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public AppUser Owner { get; set; } = null!;
    public ICollection<CellarMember> Members { get; set; } = [];
    public ICollection<CellarEntry> Entries { get; set; } = [];
    public ICollection<CellarShareToken> ShareTokens { get; set; } = [];
}
