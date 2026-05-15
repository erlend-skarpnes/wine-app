using System.Security.Claims;
using WineApp.Api.Extensions;
using WineApp.Api.Filters;
using WineApp.Api.Queries;
using WineApp.Api.Services;

namespace WineApp.Api.Endpoints;

public static class EntryEndpoints
{
    public static void MapEntryEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/homes/{homeId}/entries")
            .WithTags("Entries")
            .RequireAuthorization()
            .AddEndpointFilter<HomeMemberFilter>();

        // GET /api/homes/{homeId}/entries
        group.MapGet("/", async (int homeId, IStockQuery stockQuery) =>
            Results.Ok(await stockQuery.GetAggregatedAsync(homeId)));

        // GET /api/homes/{homeId}/entries/{barcode}/locations
        group.MapGet("/{barcode}/locations", async (int homeId, string barcode, IStockQuery stockQuery) =>
            Results.Ok(await stockQuery.GetLocationsAsync(homeId, barcode)));

        // POST /api/homes/{homeId}/entries/adjust
        group.MapPost("/adjust", async (int homeId, AdjustRequest req, ClaimsPrincipal user, IStockAdjuster adjuster) =>
        {
            var userId = user.GetUserId();
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
