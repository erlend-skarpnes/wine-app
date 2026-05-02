namespace WineApp.Api.Models;

public class CellarMember
{
    public int CellarId { get; set; }
    public int UserId { get; set; }
    public required string Role { get; set; } // "owner" | "member"
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public Cellar Cellar { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
