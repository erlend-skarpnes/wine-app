using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Extensions;
using WineApp.Api.Models;
using WineApp.Api.Services;

namespace WineApp.Api.Endpoints;

public static class SampleEndpoints
{
    public static void MapSampleEndpoints(this WebApplication app)
    {
        // POST /api/samples/{barcode}  (multipart/form-data: image)
        app.MapPost("/api/samples/{barcode}", async (
            string barcode,
            HttpRequest request,
            ClaimsPrincipal user,
            IWineApiService wineApi,
            AppDbContext db) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest("Expected multipart/form-data");

            var form = await request.ReadFormAsync();
            var imageFile = form.Files.GetFile("image");
            if (imageFile is null)
                return Results.BadRequest("image is required");

            var result = await wineApi.IdentifyAsync(imageFile.OpenReadStream(), imageFile.ContentType ?? "image/jpeg");

            WineData? detail = null;
            if (result.WineId is not null)
                detail = await wineApi.GetDetailAsync(result.WineId, barcode);

            var userId = user.GetUserId();
            var sample = new WineSample
            {
                Barcode = barcode,
                LabelName = detail?.Name,
                LabelType = detail?.Type,
                LabelGrapes = detail?.Grapes ?? [],
                LabelPairings = detail?.Pairings ?? [],
                LabelRegion = detail?.Region,
                LabelCountry = detail?.Country,
                Confidence = result.Confidence,
                UserId = userId,
            };

            db.WineSamples.Add(sample);
            await db.SaveChangesAsync();

            return Results.NoContent();
        }).RequireAuthorization();

        // GET /api/admin/samples
        app.MapGet("/api/admin/samples", async (AppDbContext db) =>
        {
            var samples = await db.WineSamples
                .Include(s => s.User)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            var barcodes = samples.Select(s => s.Barcode).Distinct().ToList();
            var wineDataDict = await db.WineData
                .Where(w => barcodes.Contains(w.Barcode))
                .ToDictionaryAsync(w => w.Barcode);

            return Results.Ok(samples.Select(s =>
            {
                wineDataDict.TryGetValue(s.Barcode, out var vino);
                return new SampleResponse(
                    s.Id, s.Barcode,
                    vino?.Name, vino?.Type, vino?.Grapes ?? [], vino?.Pairings ?? [],
                    s.LabelName, s.LabelType, s.LabelGrapes, s.LabelPairings,
                    s.Confidence, s.User?.Username, s.CreatedAt
                );
            }));
        }).RequireAuthorization("Admin");
    }
}

record SampleResponse(
    int Id,
    string Barcode,
    string? VinmonopoletName, string? VinmonopoletType,
    string[] VinmonopoletGrapes, string[] VinmonopoletPairings,
    string? LabelName, string? LabelType,
    string[] LabelGrapes, string[] LabelPairings,
    double Confidence,
    string? Username,
    DateTime CreatedAt
);
