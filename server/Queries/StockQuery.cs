using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Endpoints;

namespace WineApp.Api.Queries;

public class StockQuery(AppDbContext db) : IStockQuery
{
    public async Task<List<AggregatedStock>> GetAggregatedAsync(int homeId)
    {
        var rawEntries = await db.Entries
            .Where(e => e.Location.HomeId == homeId && e.Quantity > 0)
            .Include(e => e.Location)
            .Include(e => e.Section)
            .ToListAsync();

        var barcodes = rawEntries.Select(e => e.Barcode).Distinct().ToList();
        var wineMap = await db.WineData
            .Where(w => barcodes.Contains(w.Barcode))
            .ToDictionaryAsync(w => w.Barcode);

        return rawEntries
            .GroupBy(e => e.Barcode)
            .Select(g =>
            {
                wineMap.TryGetValue(g.Key, out var wine);
                var locations = g.Select(e => new LocationStock(
                    e.LocationId, e.Location.Name, e.SectionId, e.Section?.Name, e.Quantity
                )).ToList();
                return new AggregatedStock(
                    g.Key,
                    g.Sum(e => e.Quantity),
                    wine?.Name,
                    wine?.Type,
                    wine?.Pairings ?? [],
                    wine?.Grapes.Select(WineDataHelpers.StripGrapePercentage).ToArray() ?? [],
                    wine?.StoragePotential,
                    wine?.AlcoholContent,
                    locations
                );
            })
            .OrderBy(e => e.Barcode)
            .ToList();
    }

    public async Task<List<LocationStock>> GetLocationsAsync(int homeId, string barcode)
    {
        return await db.Entries
            .Where(e => e.Barcode == barcode && e.Location.HomeId == homeId)
            .Select(e => new LocationStock(
                e.LocationId, e.Location.Name, e.SectionId,
                e.Section != null ? e.Section.Name : null, e.Quantity
            ))
            .ToListAsync();
    }
}
