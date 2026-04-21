namespace WineApp.Api.Endpoints;

public static class LabelEndpoints
{
    public static void MapLabelEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/labels").WithTags("Labels");

        // Accepts an image upload and returns parsed wine details.
        // TODO: integrate an OCR / AI vision service (e.g. Azure AI Vision, OpenAI GPT-4o).
        group.MapPost("/scan", async (IFormFile image) =>
        {
            if (image.Length == 0)
                return Results.BadRequest("No image provided.");

            await Task.CompletedTask; // placeholder for async processing
            return Results.Ok(new
            {
                message = "Label scanning not yet implemented.",
                filename = image.FileName,
                sizeBytes = image.Length
            });
        }).DisableAntiforgery();
    }
}
