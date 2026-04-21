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

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.CellarEntries.Include(e => e.Wine).FirstOrDefaultAsync(e => e.Id == id)
                is CellarEntry entry ? Results.Ok(entry) : Results.NotFound());

        group.MapPost("/", async (CellarEntry entry, AppDbContext db) =>
        {
            entry.CreatedAt = DateTime.UtcNow;
            db.CellarEntries.Add(entry);
            await db.SaveChangesAsync();
            return Results.Created($"/api/cellar/{entry.Id}", entry);
        });

        group.MapPut("/{id:int}", async (int id, CellarEntry updated, AppDbContext db) =>
        {
            var entry = await db.CellarEntries.FindAsync(id);
            if (entry is null) return Results.NotFound();

            entry.Quantity = updated.Quantity;
            entry.PurchasePrice = updated.PurchasePrice;
            entry.PurchasedAt = updated.PurchasedAt;
            entry.DrinkFrom = updated.DrinkFrom;
            entry.DrinkUntil = updated.DrinkUntil;
            entry.Location = updated.Location;
            entry.Notes = updated.Notes;

            await db.SaveChangesAsync();
            return Results.Ok(entry);
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var entry = await db.CellarEntries.FindAsync(id);
            if (entry is null) return Results.NotFound();
            db.CellarEntries.Remove(entry);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
