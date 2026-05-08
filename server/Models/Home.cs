namespace WineApp.Api.Models;

public class Home
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public int OwnerId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public AppUser Owner { get; set; } = null!;
    public ICollection<HomeMember> Members { get; set; } = [];
    public ICollection<Location> Locations { get; set; } = [];
    public ICollection<HomeShareToken> ShareTokens { get; set; } = [];
}
