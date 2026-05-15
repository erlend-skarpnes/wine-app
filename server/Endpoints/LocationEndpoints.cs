using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Filters;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var memberGroup = app.MapGroup("/api/homes/{homeId}/locations")
            .WithTags("Locations")
            .RequireAuthorization()
            .AddEndpointFilter<HomeMemberFilter>();

        var ownerGroup = app.MapGroup("/api/homes/{homeId}/locations")
            .WithTags("Locations")
            .RequireAuthorization()
            .AddEndpointFilter<HomeOwnerFilter>();

        // GET /api/homes/{homeId}/locations
        memberGroup.MapGet("/", async (int homeId, AppDbContext db) =>
        {
            var locations = await db.Locations
                .Where(l => l.HomeId == homeId)
                .OrderBy(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    l.Name,
                    Sections = l.Sections
                        .OrderBy(s => s.CreatedAt)
                        .Select(s => new { s.Id, s.Name })
                        .ToList(),
                })
                .ToListAsync();

            return Results.Ok(locations);
        });

        // POST /api/homes/{homeId}/locations
        ownerGroup.MapPost("/", async (int homeId, CreateLocationRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var location = new Location { Name = req.Name.Trim(), HomeId = homeId };
            db.Locations.Add(location);
            await db.SaveChangesAsync();
            return Results.Created($"/api/homes/{homeId}/locations/{location.Id}", new
            {
                location.Id,
                location.Name,
                Sections = Array.Empty<object>(),
            });
        });

        // PATCH /api/homes/{homeId}/locations/{locId}
        ownerGroup.MapPatch("/{locId}", async (int homeId, int locId, RenameLocationRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == locId && l.HomeId == homeId);
            if (location is null) return Results.NotFound();

            location.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { location.Id, location.Name });
        });

        // DELETE /api/homes/{homeId}/locations/{locId}
        ownerGroup.MapDelete("/{locId}", async (int homeId, int locId, AppDbContext db) =>
        {
            var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == locId && l.HomeId == homeId);
            if (location is null) return Results.NotFound();

            if (await db.Entries.AnyAsync(e => e.LocationId == locId && e.Quantity > 0))
                return Results.Conflict(new { code = "BOTTLES_REMAINING", message = "Plasseringen inneholder fremdeles flasker. Tøm den før du sletter." });

            db.Locations.Remove(location);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // POST /api/homes/{homeId}/locations/{locId}/sections
        ownerGroup.MapPost("/{locId}/sections", async (int homeId, int locId, CreateSectionRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            if (!await db.Locations.AnyAsync(l => l.Id == locId && l.HomeId == homeId))
                return Results.NotFound();

            var section = new Section { Name = req.Name.Trim(), LocationId = locId };
            db.Sections.Add(section);
            await db.SaveChangesAsync();
            return Results.Created(
                $"/api/homes/{homeId}/locations/{locId}/sections/{section.Id}",
                new { section.Id, section.Name });
        });

        // PATCH /api/homes/{homeId}/locations/{locId}/sections/{secId}
        ownerGroup.MapPatch("/{locId}/sections/{secId}", async (int homeId, int locId, int secId, RenameSectionRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var section = await db.Sections
                .Include(s => s.Location)
                .FirstOrDefaultAsync(s => s.Id == secId && s.LocationId == locId && s.Location.HomeId == homeId);
            if (section is null) return Results.NotFound();

            section.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { section.Id, section.Name });
        });

        // DELETE /api/homes/{homeId}/locations/{locId}/sections/{secId}
        ownerGroup.MapDelete("/{locId}/sections/{secId}", async (int homeId, int locId, int secId, AppDbContext db) =>
        {
            var section = await db.Sections
                .Include(s => s.Location)
                .FirstOrDefaultAsync(s => s.Id == secId && s.LocationId == locId && s.Location.HomeId == homeId);
            if (section is null) return Results.NotFound();

            if (await db.Entries.AnyAsync(e => e.SectionId == secId && e.Quantity > 0))
                return Results.Conflict(new { code = "BOTTLES_REMAINING", message = "Seksjonen inneholder fremdeles flasker." });

            // DB cascade (SetNull) clears SectionId on zero-quantity entries automatically
            db.Sections.Remove(section);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }
}

record CreateLocationRequest(string Name);
record RenameLocationRequest(string Name);
record CreateSectionRequest(string Name);
record RenameSectionRequest(string Name);
