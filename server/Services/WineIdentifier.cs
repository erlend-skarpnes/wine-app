using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class WineIdentifier(IWineApiService wineApi, AppDbContext db) : IWineIdentifier
{
    public async Task<IdentifyOutcome> IdentifyAsync(string barcode, Stream image, string contentType)
    {
        var result = await wineApi.IdentifyAsync(image, contentType);
        if (result.WineId is not null)
        {
            var wine = await wineApi.GetDetailAsync(result.WineId, barcode);
            await Upsert(wine);
            return new WineIdentified(wine);
        }
        return new WineSuggestions(result.Suggestions);
    }

    public async Task<WineData> LinkAsync(string barcode, string productCode)
    {
        var wine = await wineApi.GetDetailAsync(productCode, barcode);
        await Upsert(wine);
        return wine;
    }

    private async Task Upsert(WineData incoming)
    {
        var existing = await db.WineData.FindAsync(incoming.Barcode);
        if (existing is not null)
            db.Entry(existing).CurrentValues.SetValues(incoming);
        else
            db.WineData.Add(incoming);
        await db.SaveChangesAsync();
    }
}
