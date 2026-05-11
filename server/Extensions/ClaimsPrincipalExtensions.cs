using System.Security.Claims;

namespace WineApp.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue("sub")!);
}
