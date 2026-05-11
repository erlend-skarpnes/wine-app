using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Authorization;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class HomeEndpoints
{
    public static void MapHomeEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/homes").WithTags("Homes").RequireAuthorization();

        // GET /api/homes
        group.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var homes = await db.HomeMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Home)
                .Select(m => new
                {
                    m.Home.Id,
                    m.Home.Name,
                    IsOwner = m.Home.OwnerId == userId,
                    MemberCount = m.Home.Members.Count,
                })
                .ToListAsync();
            return Results.Ok(homes);
        });

        // POST /api/homes
        group.MapPost("/", async (CreateHomeRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = user.GetUserId();
            var home = new Home { Name = req.Name.Trim(), OwnerId = userId };
            db.Homes.Add(home);
            db.HomeMembers.Add(new HomeMember { Home = home, UserId = userId });
            await db.SaveChangesAsync();
            return Results.Created($"/api/homes/{home.Id}", new
            {
                home.Id,
                home.Name,
                IsOwner = true,
                MemberCount = 1,
            });
        });

        // PATCH /api/homes/{id}
        group.MapPatch("/{id}", async (int id, RenameHomeRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsOwner(userId, id, db))
                return Results.Forbid();

            var home = await db.Homes.FindAsync(id);
            if (home is null) return Results.NotFound();

            home.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { home.Id, home.Name });
        });

        // DELETE /api/homes/{id}
        group.MapDelete("/{id}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsOwner(userId, id, db))
                return Results.Forbid();

            if (await db.Entries.AnyAsync(e => e.HomeId == id && e.Quantity > 0))
                return Results.Conflict(new { code = "BOTTLES_REMAINING", message = "Hjemmet inneholder fremdeles flasker. Tøm det før du sletter." });

            var ownedHomeCount = await db.Homes.CountAsync(h => h.OwnerId == userId);
            if (ownedHomeCount <= 1)
                return Results.Conflict(new { code = "LAST_HOME", message = "Du kan ikke slette ditt siste hjem." });

            var home = await db.Homes.FindAsync(id);
            if (home is null) return Results.NotFound();

            db.Homes.Remove(home);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // GET /api/homes/{id}/members
        group.MapGet("/{id}/members", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsMember(userId, id, db))
                return Results.Forbid();

            var members = await db.HomeMembers
                .Where(m => m.HomeId == id)
                .Include(m => m.User)
                .Select(m => new
                {
                    UserId = m.UserId,
                    Username = m.User.Username,
                    IsOwner = m.Home.OwnerId == m.UserId,
                    m.JoinedAt,
                })
                .ToListAsync();

            return Results.Ok(members);
        });

        // DELETE /api/homes/{id}/members/{memberId}
        group.MapDelete("/{id}/members/{memberId}", async (int id, int memberId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();
            var isOwner = await HomeAuthorization.IsOwner(userId, id, db);
            var isSelf = userId == memberId;

            if (!isOwner && !isSelf)
                return Results.Forbid();

            if (isSelf && await db.Homes.AnyAsync(h => h.Id == id && h.OwnerId == userId))
                return Results.BadRequest(new { code = "OWNER_CANNOT_LEAVE", message = "Du kan ikke forlate hjemmet som eier. Slett hjemmet i stedet." });

            var membership = await db.HomeMembers.FindAsync(id, memberId);
            if (membership is null) return Results.NotFound();

            db.HomeMembers.Remove(membership);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // POST /api/homes/{id}/share
        group.MapPost("/{id}/share", async (int id, ClaimsPrincipal user, AppDbContext db, HttpRequest request) =>
        {
            var userId = user.GetUserId();
            if (!await HomeAuthorization.IsOwner(userId, id, db))
                return Results.Forbid();

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            db.HomeShareTokens.Add(new HomeShareToken
            {
                Token = token,
                HomeId = id,
                CreatedByUserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });
            await db.SaveChangesAsync();

            var origin = $"{request.Scheme}://{request.Host}";
            return Results.Ok(new { url = $"{origin}/homes/join/{token}" });
        });

        // GET /api/homes/join/{token} — preview without joining
        group.MapGet("/join/{token}", async (string token, AppDbContext db) =>
        {
            var shareToken = await db.HomeShareTokens
                .Include(t => t.Home)
                .FirstOrDefaultAsync(t => t.Token == token);

            if (shareToken is null || !shareToken.IsValid())
                return Results.NotFound(new { message = "Invitasjonen er ugyldig eller utløpt." });

            return Results.Ok(new { homeId = shareToken.HomeId, homeName = shareToken.Home.Name });
        }).AllowAnonymous();

        // POST /api/homes/join/{token}
        group.MapPost("/join/{token}", async (string token, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();

            var shareToken = await db.HomeShareTokens
                .Include(t => t.Home)
                .FirstOrDefaultAsync(t => t.Token == token);

            if (shareToken is null || !shareToken.IsValid())
                return Results.BadRequest(new { code = "INVALID_TOKEN", message = "Invitasjonen er ugyldig eller utløpt." });

            if (await db.HomeMembers.AnyAsync(m => m.HomeId == shareToken.HomeId && m.UserId == userId))
                return Results.Conflict(new { code = "ALREADY_MEMBER", message = "Du er allerede medlem av dette hjemmet." });

            db.HomeMembers.Add(new HomeMember { HomeId = shareToken.HomeId, UserId = userId });
            shareToken.IsUsed = true;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = shareToken.Home.Id,
                name = shareToken.Home.Name,
                isOwner = false,
                memberCount = await db.HomeMembers.CountAsync(m => m.HomeId == shareToken.HomeId),
            });
        });
    }

}

record CreateHomeRequest(string Name);
record RenameHomeRequest(string Name);
