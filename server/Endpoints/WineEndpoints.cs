using WineApp.Api.Data;
using WineApp.Api.Models;
using WineApp.Api.Services;

namespace WineApp.Api.Endpoints;

public static class WineEndpoints
{
    public static void MapWineEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines");

        // GET /api/wines/{barcode}
        group.MapGet("/{barcode}", async (string barcode, AppDbContext db) =>
        {
            var data = await db.WineData.FindAsync(barcode);
            return data is not null ? Results.Ok(data) : Results.NotFound();
        });

        // POST /api/wines/identify  (multipart/form-data: barcode + image)
        group.MapPost("/identify", async (HttpRequest request, AppDbContext db, WineApiService wineApi) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest("Expected multipart/form-data");

            var form = await request.ReadFormAsync();
            var barcode = form["barcode"].FirstOrDefault();
            var imageFile = form.Files.GetFile("image");

            if (string.IsNullOrWhiteSpace(barcode) || imageFile is null)
                return Results.BadRequest("barcode and image are required");

            var identified = await wineApi.IdentifyAsync(
                imageFile.OpenReadStream(),
                imageFile.ContentType ?? "image/jpeg");

            if (identified.WineId is not null)
            {
                var wineData = await wineApi.GetDetailAsync(identified.WineId, barcode);
                await Upsert(db, wineData);
                return Results.Ok(new { status = "identified", wineData });
            }

            return Results.Ok(new { status = "suggestions", suggestions = identified.Suggestions });
        });

        // POST /api/wines/link  { barcode, wineApiId }
        group.MapPost("/link", async (LinkRequest req, AppDbContext db, WineApiService wineApi) =>
        {
            var wineData = await wineApi.GetDetailAsync(req.WineApiId, req.Barcode);
            await Upsert(db, wineData);
            return Results.Ok(wineData);
        });
    }

    private static async Task Upsert(AppDbContext db, WineData incoming)
    {
        var existing = await db.WineData.FindAsync(incoming.Barcode);
        if (existing is not null)
            db.Entry(existing).CurrentValues.SetValues(incoming);
        else
            db.WineData.Add(incoming);

        await db.SaveChangesAsync();
    }
}

record LinkRequest(string Barcode, string WineApiId);
