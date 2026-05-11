using WineApp.Api.Models;

namespace WineApp.Api.Extensions;

public static class ExpirableTokenExtensions
{
    public static bool IsValid(this IExpirableToken token) =>
        !token.IsUsed && token.ExpiresAt >= DateTime.UtcNow;
}
