using WineApp.Api.Data;
using WineApp.Api.Models;
using WineApp.Api.Services;

namespace WineApp.Api.Endpoints;

public static class WineEndpoints
{
    public static void MapWineEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines").RequireAuthorization();

        // GET /api/wines/{barcode}
        // Checks the local DB first; on a miss, tries Vinmonopolet automatically.
        group.MapGet("/{barcode}", async (string barcode, AppDbContext db, IVinmonopoletService vinmonopolet) =>
        {
            var data = await db.WineData.FindAsync(barcode);
            if (data is not null && !data.Refetch)
                return Results.Ok(data);

            var fetched = await vinmonopolet.GetByBarcodeAsync(barcode);
            if (fetched is null)
            {
                if (data is not null)
                    return Results.Ok(data);
                return Results.NotFound();
            }

            await Upsert(db, fetched);
            return Results.Ok(fetched);
        });

        // POST /api/wines/identify  (multipart/form-data: barcode + image)
        group.MapPost("/identify", async (HttpRequest request, IWineIdentifier identifier) =>
        {
            if (!request.HasFormContentType)
                return Results.BadRequest("Expected multipart/form-data");

            var form = await request.ReadFormAsync();
            var barcode = form["barcode"].FirstOrDefault();
            var imageFile = form.Files.GetFile("image");

            if (string.IsNullOrWhiteSpace(barcode) || imageFile is null)
                return Results.BadRequest("barcode and image are required");

            var outcome = await identifier.IdentifyAsync(barcode, imageFile.OpenReadStream(), imageFile.ContentType ?? "image/jpeg");
            return outcome switch
            {
                WineIdentified(var wine)         => Results.Ok(new { status = "identified", wineData = wine }),
                WineSuggestions(var suggestions) => Results.Ok(new { status = "suggestions", suggestions }),
                _                                => Results.Problem()
            };
        });

        // POST /api/wines/link  { barcode, productCode }
        group.MapPost("/link", async (LinkRequest req, IWineIdentifier identifier) =>
        {
            var wine = await identifier.LinkAsync(req.Barcode, req.ProductCode);
            return Results.Ok(wine);
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

record LinkRequest(string Barcode, string ProductCode);
