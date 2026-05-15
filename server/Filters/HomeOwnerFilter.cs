using WineApp.Api.Authorization;
using WineApp.Api.Data;
using WineApp.Api.Extensions;

namespace WineApp.Api.Filters;

public class HomeOwnerFilter(AppDbContext db) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext ctx, EndpointFilterDelegate next)
    {
        var userId = ctx.HttpContext.User.GetUserId();
        if (!int.TryParse(ctx.HttpContext.GetRouteValue("homeId")?.ToString(), out var homeId))
            return Results.BadRequest();
        if (!await HomeAuthorization.IsOwner(userId, homeId, db))
            return Results.Forbid();
        return await next(ctx);
    }
}
