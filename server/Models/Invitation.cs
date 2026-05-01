namespace WineApp.Api.Models;

public class Invitation
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
}
