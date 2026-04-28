using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class CellarEndpoints
{
    public static void MapCellarEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/cellar").WithTags("Cellar").RequireAuthorization();

        group.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            var entries = await db.CellarEntries
                .Where(e => e.UserId == userId && e.Quantity > 0)
                .OrderBy(e => e.Barcode)
                .GroupJoin(db.WineData, e => e.Barcode, w => w.Barcode, (e, wines) => new { e, wines })
                .SelectMany(x => x.wines.DefaultIfEmpty(), (x, wine) => new
                {
                    x.e.Barcode,
                    x.e.Quantity,
                    Name             = wine != null ? wine.Name             : null,
                    Type             = wine != null ? wine.Type             : null,
                    Pairings         = wine != null ? wine.Pairings         : new string[0],
                    Grapes           = wine != null ? wine.Grapes           : new string[0],
                    StoragePotential = wine != null ? wine.StoragePotential : null,
                    AlcoholContent   = wine != null ? wine.AlcoholContent   : (double?)null,
                })
                .ToListAsync();

            return Results.Ok(entries);
        });

        group.MapPost("/adjust", async (AdjustRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId))
                return Results.Unauthorized();

            var entry = await db.CellarEntries.FindAsync(userId, req.Barcode);

            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { message = "Nothing to remove." });

                entry = new CellarEntry { UserId = userId, Barcode = req.Barcode, Quantity = req.Delta };
                db.CellarEntries.Add(entry);
            }
            else
            {
                entry.Quantity = Math.Max(0, entry.Quantity + req.Delta);
            }

            await db.SaveChangesAsync();
            return Results.Ok(entry);
        });
    }
}

record AdjustRequest(string Barcode, int Delta);
