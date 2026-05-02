using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class CellarEndpoints
{
    public static void MapCellarEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/cellars").WithTags("Cellars").RequireAuthorization();

        // GET /api/cellars — list all cellars the user belongs to
        group.MapGet("/", async (ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            var cellars = await db.CellarMembers
                .Where(m => m.UserId == userId)
                .Include(m => m.Cellar)
                .Select(m => new
                {
                    m.Cellar.Id,
                    m.Cellar.Name,
                    m.Role,
                    MemberCount = m.Cellar.Members.Count,
                })
                .ToListAsync();
            return Results.Ok(cellars);
        });

        // POST /api/cellars — create a new cellar
        group.MapPost("/", async (CreateCellarRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            var cellar = new Cellar { Name = req.Name.Trim(), OwnerId = userId };
            db.Cellars.Add(cellar);
            db.CellarMembers.Add(new CellarMember { Cellar = cellar, UserId = userId, Role = "owner" });
            await db.SaveChangesAsync();
            return Results.Created($"/api/cellars/{cellar.Id}", new { cellar.Id, cellar.Name, Role = "owner", MemberCount = 1 });
        });

        // PATCH /api/cellars/{id} — rename
        group.MapPatch("/{id}", async (int id, RenameCellarRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { message = "Navn kan ikke være tomt." });

            var userId = GetUserId(user);
            if (!await IsOwner(userId, id, db))
                return Results.Forbid();

            var cellar = await db.Cellars.FindAsync(id);
            if (cellar is null) return Results.NotFound();

            cellar.Name = req.Name.Trim();
            await db.SaveChangesAsync();
            return Results.Ok(new { cellar.Id, cellar.Name });
        });

        // DELETE /api/cellars/{id} — delete (owner only, blocked if non-empty or last cellar)
        group.MapDelete("/{id}", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsOwner(userId, id, db))
                return Results.Forbid();

            if (await db.CellarEntries.AnyAsync(e => e.CellarId == id && e.Quantity > 0))
                return Results.Conflict(new { message = "Kjelleren inneholder fremdeles flasker. Tøm den før du sletter." });

            var cellarCount = await db.CellarMembers.CountAsync(m => m.UserId == userId);
            if (cellarCount <= 1)
                return Results.Conflict(new { message = "Du kan ikke slette din siste kjeller." });

            var cellar = await db.Cellars.FindAsync(id);
            if (cellar is null) return Results.NotFound();

            db.Cellars.Remove(cellar);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // GET /api/cellars/{id}/entries — list entries with wine data
        group.MapGet("/{id}/entries", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, id, db))
                return Results.Forbid();

            var entries = await db.CellarEntries
                .Where(e => e.CellarId == id && e.Quantity > 0)
                .OrderBy(e => e.Barcode)
                .GroupJoin(db.WineData, e => e.Barcode, w => w.Barcode, (e, wines) => new { e, wines })
                .SelectMany(x => x.wines.DefaultIfEmpty(), (x, wine) => new
                {
                    x.e.Barcode,
                    x.e.Quantity,
                    Name             = wine != null ? wine.Name             : null,
                    Type             = wine != null ? wine.Type             : null,
                    Pairings         = wine != null ? wine.Pairings         : new string[0],
                    Grapes           = wine != null ? wine.Grapes           : new string[0],
                    StoragePotential = wine != null ? wine.StoragePotential : null,
                    AlcoholContent   = wine != null ? wine.AlcoholContent   : (double?)null,
                })
                .ToListAsync();

            return Results.Ok(entries);
        });

        // POST /api/cellars/{id}/entries/adjust — adjust bottle quantity
        group.MapPost("/{id}/entries/adjust", async (int id, AdjustRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, id, db))
                return Results.Forbid();

            var entry = await db.CellarEntries.FindAsync(id, req.Barcode);

            if (entry is null)
            {
                if (req.Delta <= 0)
                    return Results.BadRequest(new { message = "Nothing to remove." });
                entry = new CellarEntry { CellarId = id, Barcode = req.Barcode, Quantity = req.Delta };
                db.CellarEntries.Add(entry);
            }
            else
            {
                entry.Quantity = Math.Max(0, entry.Quantity + req.Delta);
            }

            await db.SaveChangesAsync();
            return Results.Ok(entry);
        });

        // GET /api/cellars/{id}/members — list members
        group.MapGet("/{id}/members", async (int id, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            if (!await IsMember(userId, id, db))
                return Results.Forbid();

            var members = await db.CellarMembers
                .Where(m => m.CellarId == id)
                .Include(m => m.User)
                .Select(m => new { UserId = m.UserId, Username = m.User.Username, m.Role, m.JoinedAt })
                .ToListAsync();

            return Results.Ok(members);
        });

        // DELETE /api/cellars/{id}/members/{memberId} — remove member (owner) or leave (self)
        group.MapDelete("/{id}/members/{memberId}", async (int id, int memberId, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);
            var isOwner = await IsOwner(userId, id, db);
            var isSelf = userId == memberId;

            if (!isOwner && !isSelf)
                return Results.Forbid();

            // Owner can't leave if they're the sole owner
            if (isSelf)
            {
                var ownerCount = await db.CellarMembers.CountAsync(m => m.CellarId == id && m.Role == "owner");
                if (ownerCount <= 1 && await IsOwner(userId, id, db))
                    return Results.BadRequest(new { message = "Du kan ikke forlate kjelleren som eneste eier." });
            }

            var membership = await db.CellarMembers.FindAsync(id, memberId);
            if (membership is null) return Results.NotFound();

            db.CellarMembers.Remove(membership);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // POST /api/cellars/{id}/share — generate share link (owner only)
        group.MapPost("/{id}/share", async (int id, ClaimsPrincipal user, AppDbContext db, HttpRequest request) =>
        {
            var userId = GetUserId(user);
            if (!await IsOwner(userId, id, db))
                return Results.Forbid();

            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            db.CellarShareTokens.Add(new CellarShareToken
            {
                Token = token,
                CellarId = id,
                CreatedByUserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });
            await db.SaveChangesAsync();

            var origin = $"{request.Scheme}://{request.Host}";
            return Results.Ok(new { url = $"{origin}/cellars/join/{token}" });
        });

        // GET /api/cellars/join/{token} — preview cellar info without joining
        group.MapGet("/join/{token}", async (string token, AppDbContext db) =>
        {
            var shareToken = await db.CellarShareTokens
                .Include(t => t.Cellar)
                .FirstOrDefaultAsync(t => t.Token == token);

            if (shareToken is null || shareToken.IsUsed || shareToken.ExpiresAt < DateTime.UtcNow)
                return Results.NotFound(new { message = "Invitasjonen er ugyldig eller utløpt." });

            return Results.Ok(new { cellarId = shareToken.CellarId, cellarName = shareToken.Cellar.Name });
        });

        // POST /api/cellars/join/{token} — accept share invitation
        group.MapPost("/join/{token}", async (string token, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = GetUserId(user);

            var shareToken = await db.CellarShareTokens
                .Include(t => t.Cellar)
                .FirstOrDefaultAsync(t => t.Token == token);

            if (shareToken is null || shareToken.IsUsed || shareToken.ExpiresAt < DateTime.UtcNow)
                return Results.BadRequest(new { message = "Invitasjonen er ugyldig eller utløpt." });

            if (await db.CellarMembers.AnyAsync(m => m.CellarId == shareToken.CellarId && m.UserId == userId))
                return Results.Conflict(new { message = "Du er allerede medlem av denne kjelleren." });

            db.CellarMembers.Add(new CellarMember
            {
                CellarId = shareToken.CellarId,
                UserId = userId,
                Role = "member",
            });
            shareToken.IsUsed = true;
            await db.SaveChangesAsync();

            return Results.Ok(new
            {
                id = shareToken.Cellar.Id,
                name = shareToken.Cellar.Name,
                role = "member",
                memberCount = await db.CellarMembers.CountAsync(m => m.CellarId == shareToken.CellarId),
            });
        });
    }

    private static int GetUserId(ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue("sub")!);

    private static async Task<bool> IsMember(int userId, int cellarId, AppDbContext db) =>
        await db.CellarMembers.AnyAsync(m => m.CellarId == cellarId && m.UserId == userId);

    private static async Task<bool> IsOwner(int userId, int cellarId, AppDbContext db) =>
        await db.CellarMembers.AnyAsync(m => m.CellarId == cellarId && m.UserId == userId && m.Role == "owner");
}

record AdjustRequest(string Barcode, int Delta);
record CreateCellarRequest(string Name);
record RenameCellarRequest(string Name);
