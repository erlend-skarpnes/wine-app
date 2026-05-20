using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class WineCache(AppDbContext db) : IWineCache
{
    public async Task StoreAsync(WineData wine)
    {
        var existing = await db.WineData.FindAsync(wine.Barcode);
        if (existing is not null)
            db.Entry(existing).CurrentValues.SetValues(wine);
        else
            db.WineData.Add(wine);
        await db.SaveChangesAsync();
    }
}
