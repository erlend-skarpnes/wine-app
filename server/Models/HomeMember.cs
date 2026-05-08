namespace WineApp.Api.Models;

public class HomeMember
{
    public int HomeId { get; set; }
    public int UserId { get; set; }
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public Home Home { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
