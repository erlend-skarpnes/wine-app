using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class EntryEndpoints
{
    public static void MapEntryEndpoints(this WebApplication app)
    {
        var homeGroup = app.MapGroup("/api/homes/{homeId}/entries").WithTags("Entries").RequireAuthorization();

        // GET /api/homes/{homeId}/entries
        homeGroup.MapGet("/", async (int homeId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, homeId, db))
                return Results.Forbid();

            var rawEntries = await db.Entries
                .Where(e => e.Location.HomeId == homeId && e.Quantity > 0)
                .Include(e => e.Location)
                .Include(e => e.Section)
                .ToListAsync();

            var barcodes = rawEntries.Select(e => e.Barcode).Distinct().ToList();
            var wineDataMap = await db.WineData
                .Where(w => barcodes.Contains(w.Barcode))
                .ToDictionaryAsync(w => w.Barcode);

            var result = rawEntries
                .GroupBy(e => e.Barcode)
                .Select(g =>
                {
                    wineDataMap.TryGetValue(g.Key, out var wine);
                    return new
                    {
                        barcode = g.Key,
                        quantity = g.Sum(e => e.Quantity),
                        name = wine?.Name,
                        type = wine?.Type,
                        pairings = wine?.Pairings ?? [],
                        grapes = wine?.Grapes.Select(WineDataHelpers.StripGrapePercentage).ToArray() ?? [],
                        storagePotential = wine?.StoragePotential,
                        alcoholContent = wine?.AlcoholContent,
                        locations = g.Select(e => new
                        {
                            locationId = e.LocationId,
                            locationName = e.Location.Name,
                            sectionId = e.SectionId,
                            sectionName = e.Section?.Name,
                            quantity = e.Quantity,
                        }).ToList(),
                    };
                })
                .OrderBy(e => e.barcode)
                .ToList();

            return Results.Ok(result);
        });

        // GET /api/homes/{homeId}/entries/{barcode}/locations
        homeGroup.MapGet("/{barcode}/locations", async (int homeId, string barcode, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, homeId, db))
                return Results.Forbid();

            var locations = await db.Entries
                .Where(e => e.Barcode == barcode && e.Location.HomeId == homeId)
                .Select(e => new
                {
                    locationId = e.LocationId,
                    locationName = e.Location.Name,
                    sectionId = e.SectionId,
                    sectionName = e.Section != null ? e.Section.Name : null,
                    quantity = e.Quantity,
                })
                .ToListAsync();

            return Results.Ok(locations);
        });

        // POST /api/locations/{locationId}/entries/adjust
        var locationGroup = app.MapGroup("/api/locations/{locationId}/entries").WithTags("Entries").RequireAuthorization();

        locationGroup.MapPost("/adjust", async (int locationId, AdjustRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);

            var location = await db.Locations.FindAsync(locationId);
            if (location is null) return Results.NotFound();

            if (!await IsMember(userId, location.HomeId, db))
                return Results.Forbid();

            var entry = await db.Entries.FindAsync(locationId, req.Barcode);
            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { message = "Nothing to remove." });
                entry = new Entry { LocationId = locationId, Barcode = req.Barcode, Quantity = req.Delta, SectionId = req.SectionId };
                db.Entries.Add(entry);
            }
            else
            {
                entry.Quantity = Math.Max(0, entry.Quantity + req.Delta);
                if (req.SectionId.HasValue)
                    entry.SectionId = req.SectionId;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { locationId = entry.LocationId, barcode = entry.Barcode, quantity = entry.Quantity, sectionId = entry.SectionId });
        });
    }

    private static int GetUserId(ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue("sub")!);

    private static async Task<bool> IsMember(int userId, int homeId, AppDbContext db) =>
        await db.HomeMembers.AnyAsync(m => m.HomeId == homeId && m.UserId == userId);
}

record AdjustRequest(string Barcode, int Delta, int? SectionId);
