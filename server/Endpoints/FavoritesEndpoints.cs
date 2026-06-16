using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class FavoritesEndpoints
{
    public static void MapFavoritesEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/favorites").WithTags("Favorites").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var items = await db.FavoriteWines
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.AddedAt)
                .Select(f => new
                {
                    f.Barcode,
                    AddedAt = f.AddedAt,
                    WineName = db.WineData.Where(w => w.Barcode == f.Barcode).Select(w => (string?)w.Name).FirstOrDefault(),
                    WineType = db.WineData.Where(w => w.Barcode == f.Barcode).Select(w => (string?)w.Type).FirstOrDefault(),
                    WineImageUrl = db.WineData.Where(w => w.Barcode == f.Barcode).Select(w => (string?)w.ImageUrl).FirstOrDefault(),
                })
                .ToListAsync();

            return Results.Ok(items);
        });

        group.MapPost("/{barcode}", async (string barcode, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var existing = await db.FavoriteWines.FirstOrDefaultAsync(f => f.UserId == userId && f.Barcode == barcode);
            if (existing is not null) return Results.Ok(new { isFavorite = true });

            db.FavoriteWines.Add(new FavoriteWine { UserId = userId, Barcode = barcode, AddedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
            return Results.Ok(new { isFavorite = true });
        });

        group.MapDelete("/{barcode}", async (string barcode, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var existing = await db.FavoriteWines.FirstOrDefaultAsync(f => f.UserId == userId && f.Barcode == barcode);
            if (existing is null) return Results.NoContent();

            db.FavoriteWines.Remove(existing);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
