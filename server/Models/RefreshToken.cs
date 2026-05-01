namespace WineApp.Api.Models;

public class RefreshToken
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public required int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; }
}
