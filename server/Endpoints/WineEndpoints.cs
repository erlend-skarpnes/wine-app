using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Endpoints;

public static class WineEndpoints
{
    public static void MapWineEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/wines").WithTags("Wines");

        group.MapGet("/barcode/{barcode}", async (string barcode, AppDbContext db) =>
            await db.Wines.Include(w => w.CellarEntries).FirstOrDefaultAsync(w => w.Barcode == barcode)
                is Wine wine ? Results.Ok(wine) : Results.NotFound());
    }
}
