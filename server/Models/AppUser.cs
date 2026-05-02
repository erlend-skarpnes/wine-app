namespace WineApp.Api.Models;

public class AppUser
{
    public int Id { get; set; }
    public required string Username { get; set; }
    public required string PasswordHash { get; set; }
    public bool IsAdmin { get; set; }
    public int FailedAttempts { get; set; }
    public DateTime? LockedUntil { get; set; }
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}
