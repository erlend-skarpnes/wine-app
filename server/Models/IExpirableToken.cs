namespace WineApp.Api.Models;

public interface IExpirableToken
{
    bool IsUsed { get; }
    DateTime ExpiresAt { get; }
}
