using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class NoteEndpoints
{
    public static void MapNoteEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/notes").WithTags("Notes").RequireAuthorization();

        // GET /api/notes/{barcode}
        group.MapGet("/{barcode}", async (string barcode, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();

            var own = await db.WineNotes
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.UserId == userId && n.Barcode == barcode);

            if (own is not null)
                return Results.Ok(new NoteResponse(own.DrinkFromYear, own.DrinkToYear, own.PersonalNote, own.User.Username, true));

            var other = await db.WineNotes
                .Include(n => n.User)
                .Where(n => n.Barcode == barcode)
                .OrderBy(n => n.CreatedAt)
                .FirstOrDefaultAsync();

            if (other is null) return Results.NotFound();

            return Results.Ok(new NoteResponse(other.DrinkFromYear, other.DrinkToYear, null, other.User.Username, false));
        });

        // PUT /api/notes/{barcode}
        group.MapPut("/{barcode}", async (string barcode, UpsertNoteRequest req, ClaimsPrincipal user, AppDbContext db) =>
        {
            var userId = user.GetUserId();

            var note = await db.WineNotes
                .Include(n => n.User)
                .FirstOrDefaultAsync(n => n.UserId == userId && n.Barcode == barcode);

            if (note is null)
            {
                note = new WineNote { UserId = userId, Barcode = barcode };
                db.WineNotes.Add(note);
            }

            note.DrinkFromYear = req.DrinkFromYear;
            note.DrinkToYear = req.DrinkToYear;
            note.PersonalNote = string.IsNullOrWhiteSpace(req.PersonalNote) ? null : req.PersonalNote.Trim();
            note.UpdatedAt = DateTime.UtcNow;

            await db.SaveChangesAsync();

            await db.Entry(note).Reference(n => n.User).LoadAsync();

            return Results.Ok(new NoteResponse(note.DrinkFromYear, note.DrinkToYear, note.PersonalNote, note.User.Username, true));
        });
    }
}

record NoteResponse(int? DrinkFromYear, int? DrinkToYear, string? PersonalNote, string AuthorUsername, bool IsOwn);
record UpsertNoteRequest(int? DrinkFromYear, int? DrinkToYear, string? PersonalNote);
