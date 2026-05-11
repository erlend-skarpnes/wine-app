using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Authorization;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Models;
using WineApp.Api.Queries;

namespace WineApp.Api.Endpoints;

public static class EntryEndpoints
{
    public static void MapEntryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/homes/{homeId}/entries").WithTags("Entries").RequireAuthorization();

        // GET /api/homes/{homeId}/entries
        group.MapGet("/", async (int homeId, ClaimsPrincipal user, AppDbContext db, IStockQuery stockQuery) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            var result = await stockQuery.GetAggregatedAsync(homeId);
            return Results.Ok(result);
        });

        // GET /api/homes/{homeId}/entries/{barcode}/locations
        group.MapGet("/{barcode}/locations", async (int homeId, string barcode, ClaimsPrincipal user, AppDbContext db, IStockQuery stockQuery) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            var locations = await stockQuery.GetLocationsAsync(homeId, barcode);
            return Results.Ok(locations);
        });

        // POST /api/homes/{homeId}/entries/adjust
        group.MapPost("/adjust", async (int homeId, AdjustRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            if (req.LocationId.HasValue)
            {
                var locationExists = await db.Locations.AnyAsync(l => l.Id == req.LocationId.Value && l.HomeId == homeId);
                if (!locationExists) return Results.NotFound();
            }

            var entry = await db.Entries.FirstOrDefaultAsync(e =>
                e.HomeId == homeId &&
                e.Barcode == req.Barcode &&
                e.LocationId == req.LocationId);

            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { code = "NOTHING_TO_REMOVE", message = "Nothing to remove." });
                entry = new Entry { HomeId = homeId, LocationId = req.LocationId, Barcode = req.Barcode, Quantity = req.Delta, SectionId = req.SectionId };
                db.Entries.Add(entry);
            }
            else
            {
                entry.Quantity = Math.Max(0, entry.Quantity + req.Delta);
                if (req.SectionId.HasValue)
                    entry.SectionId = req.SectionId;
            }

            await db.SaveChangesAsync();
            return Results.Ok(new { homeId, locationId = entry.LocationId, barcode = entry.Barcode, quantity = entry.Quantity, sectionId = entry.SectionId });
        });
    }

}

record AdjustRequest(string Barcode, int Delta, int? LocationId, int? SectionId);
