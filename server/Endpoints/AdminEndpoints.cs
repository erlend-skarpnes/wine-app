using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

record ResetPasswordRequest(string NewPassword);

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/admin").WithTags("Admin").RequireAuthorization("Admin");

        // GET /api/admin/users — list all users
        group.MapGet("/users", async (AppDbContext db) =>
        {
            var users = await db.Users
                .OrderBy(u => u.Username)
                .Select(u => new { u.Id, u.Username, u.IsAdmin })
                .ToListAsync();
            return Results.Ok(users);
        });

        // PATCH /api/admin/users/{id}/password — reset a user's password
        group.MapPatch("/users/{id}/password", async (int id, ResetPasswordRequest req, AppDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.NewPassword))
                return Results.BadRequest(new { message = "Passord kan ikke være tomt." });

            var user = await db.Users.FindAsync(id);
            if (user is null)
                return Results.NotFound();

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
            user.FailedAttempts = 0;
            user.LockedUntil = null;

            await db.RefreshTokens
                .Where(r => r.UserId == id)
                .ExecuteUpdateAsync(s => s.SetProperty(r => r.IsRevoked, true));

            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        // POST /api/admin/invites — generate a single-use invite link
        group.MapPost("/invites", async (AppDbContext db, HttpRequest request) =>
        {
            var token = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
            db.Invitations.Add(new Invitation
            {
                Token = token,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
            });
            await db.SaveChangesAsync();

            var origin = $"{request.Scheme}://{request.Host}";
            return Results.Ok(new { url = $"{origin}/invite/{token}" });
        });
    }
}
