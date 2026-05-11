using WineApp.Api.Data;
using WineApp.Api.Services;

namespace WineApp.Api.Endpoints;

public static class WineEndpoints
{
    public static void MapWineEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines").RequireAuthorization();

        // GET /api/wines/{barcode}
        group.MapGet("/{barcode}", async (string barcode, IWineResolver resolver) =>
        {
            var wine = await resolver.GetAsync(barcode);
            return wine is not null ? Results.Ok(wine) : Results.NotFound();
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


}

record LinkRequest(string Barcode, string ProductCode);
