using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class CellarEndpoints
{
    public static void MapCellarEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/cellar").WithTags("Cellar");

        group.MapGet("/", async (AppDbContext db) =>
            await db.CellarEntries
                .Include(e => e.Wine)
                .Where(e => e.Quantity > 0)
                .OrderBy(e => e.Wine.Name)
                .ToListAsync());

        group.MapPost("/adjust", async (AdjustRequest req, AppDbContext db) =>
        {
            var wine = await db.Wines.FirstOrDefaultAsync(w => w.Barcode == req.Barcode);
            if (wine is null)
                return Results.NotFound(new { message = $"No wine found with barcode '{req.Barcode}'." });

            var entry = await db.CellarEntries
                .Where(e => e.WineId == wine.Id)
                .OrderBy(e => e.CreatedAt)
                .FirstOrDefaultAsync();

            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { message = "Wine has no cellar entries to remove from." });

                entry = new CellarEntry { WineId = wine.Id, Quantity = req.Delta, CreatedAt = DateTime.UtcNow };
                db.CellarEntries.Add(entry);
            }
            else
            {
                entry.Quantity = Math.Max(0, entry.Quantity + req.Delta);
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { wine, cellarEntry = entry });
        });
    }
}

record AdjustRequest(string Barcode, int Delta);
