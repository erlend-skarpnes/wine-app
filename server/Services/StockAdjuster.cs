using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class StockAdjuster(AppDbContext db) : IStockAdjuster
{
    public async Task<AdjustResult> AdjustAsync(int homeId, int userId, string barcode, int delta, int? locationId, int? sectionId)
    {
        if (locationId.HasValue)
        {
            var locationExists = await db.Locations.AnyAsync(l => l.Id == locationId.Value && l.HomeId == homeId);
            if (!locationExists) throw new LocationNotFoundException();
        }

        var entry = await db.Entries.FirstOrDefaultAsync(e =>
            e.HomeId == homeId &&
            e.Barcode == barcode &&
            e.LocationId == locationId);

        int quantityRemoved;

        if (entry is null)
        {
            if (delta <= 0) throw new NothingToRemoveException();
            entry = new Entry { HomeId = homeId, LocationId = locationId, Barcode = barcode, Quantity = delta, SectionId = sectionId };
            db.Entries.Add(entry);
            quantityRemoved = 0;
        }
        else
        {
            var previousQuantity = entry.Quantity;
            entry.Quantity = Math.Max(0, entry.Quantity + delta);
            if (sectionId.HasValue)
                entry.SectionId = sectionId;

            quantityRemoved = previousQuantity - entry.Quantity;
            if (quantityRemoved > 0)
            {
                db.DrinkLogs.Add(new DrinkLog
                {
                    UserId = userId,
                    HomeId = homeId,
                    Barcode = barcode,
                    Quantity = quantityRemoved,
                    DrankAt = DateTime.UtcNow,
                });
            }
        }

        await db.SaveChangesAsync();
        return new AdjustResult(entry, quantityRemoved);
    }
}
