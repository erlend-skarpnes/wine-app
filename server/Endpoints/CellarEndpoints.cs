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
                .Where(e => e.Quantity > 0)
                .OrderBy(e => e.Barcode)
                .GroupJoin(db.WineData, e => e.Barcode, w => w.Barcode, (e, wines) => new { e, wines })
                .SelectMany(x => x.wines.DefaultIfEmpty(), (x, wine) => new
                {
                    x.e.Barcode,
                    x.e.Quantity,
                    Name     = wine != null ? wine.Name     : null,
                    Pairings = wine != null ? wine.Pairings : new string[0],
                })
                .ToListAsync());

        group.MapPost("/adjust", async (AdjustRequest req, AppDbContext db) =>
        {
            var entry = await db.CellarEntries.FindAsync(req.Barcode);

            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { message = "Nothing to remove." });

                entry = new CellarEntry { Barcode = req.Barcode, Quantity = req.Delta };
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
