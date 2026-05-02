namespace WineApp.Api.Models;

public class CellarShareToken
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public int CellarId { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public Cellar Cellar { get; set; } = null!;
}
