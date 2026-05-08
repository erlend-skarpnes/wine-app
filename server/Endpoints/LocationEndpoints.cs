using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class LocationEndpoints
{
    public static void MapLocationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/homes/{homeId}/locations").WithTags("Locations").RequireAuthorization();

        // GET /api/homes/{homeId}/locations
        group.MapGet("/", async (int homeId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, homeId, db))
                return Results.Forbid();

            var locations = await db.Locations
                .Where(l => l.HomeId == homeId)
                .OrderBy(l => l.CreatedAt)
                .Select(l => new
                {
                    l.Id,
                    l.Name,
                    l.IsDefault,
                    Sections = l.Sections
                        .OrderBy(s => s.CreatedAt)
                        .Select(s => new { s.Id, s.Name })
                        .ToList(),
                })
                .ToListAsync();

            return Results.Ok(locations);
        });

        // POST /api/homes/{homeId}/locations
        group.MapPost("/", async (int homeId, CreateLocationRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

            var location = new Location { Name = req.Name.Trim(), HomeId = homeId, IsDefault = false };
            db.Locations.Add(location);
            await db.SaveChangesAsync();
            return Results.Created($"/api/homes/{homeId}/locations/{location.Id}", new
            {
                location.Id,
                location.Name,
                location.IsDefault,
                Sections = Array.Empty<object>(),
            });
        });

        // PATCH /api/homes/{homeId}/locations/{locId}
        group.MapPatch("/{locId}", async (int homeId, int locId, RenameLocationRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

            var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == locId && l.HomeId == homeId);
            if (location is null) return Results.NotFound();

            location.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { location.Id, location.Name });
        });

        // DELETE /api/homes/{homeId}/locations/{locId}
        group.MapDelete("/{locId}", async (int homeId, int locId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

            var location = await db.Locations.FirstOrDefaultAsync(l => l.Id == locId && l.HomeId == homeId);
            if (location is null) return Results.NotFound();

            if (location.IsDefault)
                return Results.Conflict(new { message = "Standardplasseringen kan ikke slettes." });

            if (await db.Entries.AnyAsync(e => e.LocationId == locId && e.Quantity > 0))
                return Results.Conflict(new { message = "Plasseringen inneholder fremdeles flasker. Tøm den før du sletter." });

            db.Locations.Remove(location);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // POST /api/homes/{homeId}/locations/{locId}/sections
        group.MapPost("/{locId}/sections", async (int homeId, int locId, CreateSectionRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

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
        group.MapPatch("/{locId}/sections/{secId}", async (int homeId, int locId, int secId, RenameSectionRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

            var section = await db.Sections
                .Include(s => s.Location)
                .FirstOrDefaultAsync(s => s.Id == secId && s.LocationId == locId && s.Location.HomeId == homeId);
            if (section is null) return Results.NotFound();

            section.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { section.Id, section.Name });
        });

        // DELETE /api/homes/{homeId}/locations/{locId}/sections/{secId}
        group.MapDelete("/{locId}/sections/{secId}", async (int homeId, int locId, int secId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsOwner(userId, homeId, db))
                return Results.Forbid();

            var section = await db.Sections
                .Include(s => s.Location)
                .FirstOrDefaultAsync(s => s.Id == secId && s.LocationId == locId && s.Location.HomeId == homeId);
            if (section is null) return Results.NotFound();

            if (await db.Entries.AnyAsync(e => e.SectionId == secId && e.Quantity > 0))
                return Results.Conflict(new { message = "Seksjonen inneholder fremdeles flasker." });

            // DB cascade (SetNull) clears SectionId on zero-quantity entries automatically
            db.Sections.Remove(section);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });
    }

    private static int GetUserId(ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue("sub")!);

    private static async Task<bool> IsMember(int userId, int homeId, AppDbContext db) =>
        await db.HomeMembers.AnyAsync(m => m.HomeId == homeId && m.UserId == userId);

    private static async Task<bool> IsOwner(int userId, int homeId, AppDbContext db) =>
        await db.Homes.AnyAsync(h => h.Id == homeId && h.OwnerId == userId);
}

record CreateLocationRequest(string Name);
record RenameLocationRequest(string Name);
record CreateSectionRequest(string Name);
record RenameSectionRequest(string Name);
