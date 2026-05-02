using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

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
