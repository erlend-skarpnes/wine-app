using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Extensions;

namespace WineApp.Api.Endpoints;

public static class HistoryEndpoints
{
    public static void MapHistoryEndpoints(this WebApplication app)
    {
        app.MapGet("/api/history", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();

            var items = await db.DrinkLogs
                .Where(d => d.UserId == userId)
                .OrderByDescending(d => d.DrankAt)
                .Select(d => new
                {
                    d.Id,
                    d.Barcode,
                    d.HomeId,
                    HomeName = d.Home.Name,
                    d.Quantity,
                    DrankAt = d.DrankAt,
                    WineName = d.WineData != null ? d.WineData.Name : null,
                    WineType = d.WineData != null ? d.WineData.Type : null,
                    WineImageUrl = d.WineData != null ? d.WineData.ImageUrl : null,
                })
                .Take(100)
                .ToListAsync();

            return Results.Ok(items);
        })
        .WithTags("History")
        .RequireAuthorization();
    }
}
