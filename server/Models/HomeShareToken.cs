namespace WineApp.Api.Models;

public class HomeShareToken : IExpirableToken
{
    public int Id { get; set; }
    public required string Token { get; set; }
    public int HomeId { get; set; }
    public int CreatedByUserId { get; set; }
    public DateTime ExpiresAt { get; set; }
    public bool IsUsed { get; set; }
    public Home Home { get; set; } = null!;
}
