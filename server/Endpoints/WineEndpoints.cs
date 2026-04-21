using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class WineEndpoints
{
    public static void MapWineEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines");

        group.MapGet("/", async (AppDbContext db) =>
            await db.Wines
                .Include(w => w.CellarEntries)
                .OrderBy(w => w.Name)
                .ToListAsync());

        group.MapGet("/{id:int}", async (int id, AppDbContext db) =>
            await db.Wines.Include(w => w.CellarEntries).FirstOrDefaultAsync(w => w.Id == id)
                is Wine wine ? Results.Ok(wine) : Results.NotFound());

        group.MapGet("/barcode/{barcode}", async (string barcode, AppDbContext db) =>
            await db.Wines.Include(w => w.CellarEntries).FirstOrDefaultAsync(w => w.Barcode == barcode)
                is Wine wine ? Results.Ok(wine) : Results.NotFound());

        group.MapPost("/", async (Wine wine, AppDbContext db) =>
        {
            wine.CreatedAt = DateTime.UtcNow;
            wine.UpdatedAt = DateTime.UtcNow;
            db.Wines.Add(wine);
            await db.SaveChangesAsync();
            return Results.Created($"/api/wines/{wine.Id}", wine);
        });

        group.MapPut("/{id:int}", async (int id, Wine updated, AppDbContext db) =>
        {
            var wine = await db.Wines.FindAsync(id);
            if (wine is null) return Results.NotFound();

            wine.Name = updated.Name;
            wine.Winery = updated.Winery;
            wine.Vintage = updated.Vintage;
            wine.Varietal = updated.Varietal;
            wine.Region = updated.Region;
            wine.Country = updated.Country;
            wine.Description = updated.Description;
            wine.LabelImageUrl = updated.LabelImageUrl;
            wine.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();
            return Results.Ok(wine);
        });

        group.MapDelete("/{id:int}", async (int id, AppDbContext db) =>
        {
            var wine = await db.Wines.FindAsync(id);
            if (wine is null) return Results.NotFound();
            db.Wines.Remove(wine);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}
