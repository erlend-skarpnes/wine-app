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
        var homeGroup = app.MapGroup("/api/homes/{homeId}/entries").WithTags("Entries").RequireAuthorization();

        // GET /api/homes/{homeId}/entries
        homeGroup.MapGet("/", async (int homeId, ClaimsPrincipal user, AppDbContext db, IStockQuery stockQuery) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            var result = await stockQuery.GetAggregatedAsync(homeId);
            return Results.Ok(result);
        });

        // GET /api/homes/{homeId}/entries/{barcode}/locations
        homeGroup.MapGet("/{barcode}/locations", async (int homeId, string barcode, ClaimsPrincipal user, AppDbContext db, IStockQuery stockQuery) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            var locations = await stockQuery.GetLocationsAsync(homeId, barcode);
            return Results.Ok(locations);
        });

        // POST /api/locations/{locationId}/entries/adjust
        var locationGroup = app.MapGroup("/api/locations/{locationId}/entries").WithTags("Entries").RequireAuthorization();

        locationGroup.MapPost("/adjust", async (int locationId, AdjustRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();

            var location = await db.Locations.FindAsync(locationId);
            if (location is null) return Results.NotFound();

            if (!await HomeAuthorization.IsMember(userId, location.HomeId, db))
                return Results.Forbid();

            var entry = await db.Entries.FindAsync(locationId, req.Barcode);
            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { code = "NOTHING_TO_REMOVE", message = "Nothing to remove." });
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

}

record AdjustRequest(string Barcode, int Delta, int? SectionId);
