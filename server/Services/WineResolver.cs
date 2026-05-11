using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class WineResolver(IVinmonopoletService vinmonopolet, AppDbContext db) : IWineResolver
{
    public async Task<WineData?> GetAsync(string barcode)
    {
        var cached = await db.WineData.FindAsync(barcode);
        if (cached is not null && !cached.Refetch)
            return cached;

        var fetched = await vinmonopolet.GetByBarcodeAsync(barcode);
        if (fetched is null)
            return cached; // serve stale if Vinmonopolet is unreachable

        var existing = await db.WineData.FindAsync(fetched.Barcode);
        if (existing is not null)
            db.Entry(existing).CurrentValues.SetValues(fetched);
        else
            db.WineData.Add(fetched);
        await db.SaveChangesAsync();

        return fetched;
    }
}
