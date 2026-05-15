using System.Security.Claims;
using WineApp.Api.Authorization;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Queries;
using WineApp.Api.Services;

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
        group.MapPost("/adjust", async (int homeId, AdjustRequest req, ClaimsPrincipal user, AppDbContext db, IStockAdjuster adjuster) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, homeId, db))
                return Results.Forbid();

            try
            {
                var result = await adjuster.AdjustAsync(homeId, userId, req.Barcode, req.Delta, req.LocationId, req.SectionId);
                var entry = result.Entry;
                return Results.Ok(new { homeId, locationId = entry.LocationId, barcode = entry.Barcode, quantity = entry.Quantity, sectionId = entry.SectionId });
            }
            catch (NothingToRemoveException)
            {
                return Results.BadRequest(new { code = "NOTHING_TO_REMOVE", message = "Nothing to remove." });
            }
            catch (LocationNotFoundException)
            {
                return Results.NotFound();
            }
        });
    }

}

record AdjustRequest(string Barcode, int Delta, int? LocationId, int? SectionId);
