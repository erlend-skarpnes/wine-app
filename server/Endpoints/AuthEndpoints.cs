using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class AuthEndpoints
{
    private const string AccessTokenCookie = "access_token";
    private const string RefreshTokenCookie = "refresh_token";
    private static readonly TimeSpan AccessTokenLifetime = TimeSpan.FromMinutes(15);
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(90);

    public static void MapAuthEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/auth").WithTags("Auth");

        // POST /api/auth/login
        group.MapPost("/login", async (LoginRequest req, AppDbContext db, IConfiguration config, HttpResponse response) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username.ToLower());

            if (user is not null && user.LockedUntil > DateTime.UtcNow)
                return Results.Json(new { message = "Kontoen er midlertidig låst. Prøv igjen senere." }, statusCode: 429);

            if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            {
                if (user is not null)
                {
                    user.FailedAttempts++;
                    if (user.FailedAttempts >= 5)
                        user.LockedUntil = DateTime.UtcNow.AddMinutes(15);
                    await db.SaveChangesAsync();
                }
                return Results.Unauthorized();
            }

            user.FailedAttempts = 0;
            user.LockedUntil = null;
            await IssueTokenPair(user, db, config, response);
            return Results.Ok(new { username = user.Username, isAdmin = user.IsAdmin });
        });

        // POST /api/auth/refresh
        group.MapPost("/refresh", async (AppDbContext db, IConfiguration config, HttpRequest request, HttpResponse response) =>
        {
            var rawToken = request.Cookies[RefreshTokenCookie];
            if (string.IsNullOrEmpty(rawToken))
                return Results.Unauthorized();

            var stored = await db.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == rawToken);

            if (stored is null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
            {
                ClearCookies(response);
                return Results.Unauthorized();
            }

            // Rotate: revoke old, issue new pair
            stored.IsRevoked = true;
            await db.SaveChangesAsync();

            await IssueTokenPair(stored.User, db, config, response);
            return Results.Ok(new { username = stored.User.Username });
        });

        // POST /api/auth/logout
        group.MapPost("/logout", async (AppDbContext db, HttpRequest request, HttpResponse response) =>
        {
            var rawToken = request.Cookies[RefreshTokenCookie];
            if (!string.IsNullOrEmpty(rawToken))
            {
                var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == rawToken);
                if (stored is not null)
                {
                    stored.IsRevoked = true;
                    await db.SaveChangesAsync();
                }
            }
            ClearCookies(response);
            return Results.Ok();
        });

        // GET /api/auth/me — used by frontend to check session on load
        group.MapGet("/me", (ClaimsPrincipal user) =>
        {
            var username = user.FindFirstValue("username");
            var isAdmin = user.FindFirstValue("isAdmin") == "true";
            return string.IsNullOrEmpty(username)
                ? Results.Unauthorized()
                : Results.Ok(new { username, isAdmin });
        }).RequireAuthorization();

        // GET /api/auth/invites?key=<adminKey> — admin only, generates a single-use invite link
        group.MapGet("/invites", async (AppDbContext db, IConfiguration config, HttpRequest request) =>
        {
            var adminKey = config["AdminKey"];
            if (string.IsNullOrEmpty(adminKey) || request.Query["key"].FirstOrDefault() != adminKey)
                return Results.Forbid();

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

        // POST /api/auth/register — consume invite token, create user, log in
        group.MapPost("/register", async (RegisterRequest req, AppDbContext db, IConfiguration config, HttpResponse response) =>
        {
            var invite = await db.Invitations.FirstOrDefaultAsync(i => i.Token == req.InviteToken);
            if (invite is null || invite.IsUsed || invite.ExpiresAt < DateTime.UtcNow)
                return Results.BadRequest(new { message = "Invitasjonen er ugyldig eller utløpt." });

            var normalizedUsername = req.Username.ToLower();
            if (await db.Users.AnyAsync(u => u.Username == normalizedUsername))
                return Results.Conflict(new { message = "Brukernavnet er allerede i bruk." });

            var user = new AppUser
            {
                Username = normalizedUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            };
            db.Users.Add(user);
            invite.IsUsed = true;
            await db.SaveChangesAsync();

            await IssueTokenPair(user, db, config, response);
            return Results.Ok(new { username = user.Username });
        });

        // POST /api/auth/users — admin only, protected by X-Admin-Key header
        group.MapPost("/users", async (CreateUserRequest req, AppDbContext db, IConfiguration config, HttpRequest request) =>
        {
            var adminKey = config["AdminKey"];
            if (string.IsNullOrEmpty(adminKey) || request.Headers["X-Admin-Key"].FirstOrDefault() != adminKey)
                return Results.Forbid();

            var normalizedUsername = req.Username.ToLower();
            if (await db.Users.AnyAsync(u => u.Username == normalizedUsername))
                return Results.Conflict(new { message = "Username already exists." });

            var user = new AppUser
            {
                Username = normalizedUsername,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
            return Results.Created($"/api/auth/users/{user.Id}", new { user.Id, user.Username });
        });
    }

    private static async Task IssueTokenPair(AppUser user, AppDbContext db, IConfiguration config, HttpResponse response)
    {
        var accessToken = CreateAccessToken(user, config);
        var refreshToken = GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            Token = refreshToken,
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.Add(RefreshTokenLifetime),
        });
        await db.SaveChangesAsync();

        response.Cookies.Append(AccessTokenCookie, accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/",
            MaxAge = AccessTokenLifetime,
        });

        response.Cookies.Append(RefreshTokenCookie, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth/",  // refresh token only sent to auth routes
            MaxAge = RefreshTokenLifetime,
        });
    }

    private static void ClearCookies(HttpResponse response)
    {
        response.Cookies.Delete(AccessTokenCookie);
        response.Cookies.Delete(RefreshTokenCookie, new CookieOptions { Path = "/api/auth/" });
    }

    private static string CreateAccessToken(AppUser user, IConfiguration config)
    {
        var secret = config["JwtSecret"] ?? throw new InvalidOperationException("JwtSecret not configured");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"] ?? "vinkjelleren",
            claims: [
                new Claim("sub", user.Id.ToString()),
                new Claim("username", user.Username),
                new Claim("isAdmin", user.IsAdmin ? "true" : "false"),
            ],
            expires: DateTime.UtcNow.Add(AccessTokenLifetime),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToHexString(bytes);
    }
}

record LoginRequest(string Username, string Password);
record RegisterRequest(string InviteToken, string Username, string Password);
record CreateUserRequest(string Username, string Password);
