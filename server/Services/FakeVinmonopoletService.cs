using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class FakeVinmonopoletService : IVinmonopoletService
{
    private static readonly Dictionary<string, WineData> Wines = new()
    {
        ["7090016664323"] = new WineData { Barcode = "7090016664323", ProductCode = "7090016664323", Name = "Testvinen", Type = "Rødvin" },
        ["7090016460692"] = new WineData { Barcode = "7090016460692", ProductCode = "7090016460692", Name = "Testvin 2", Type = "Hvitvin" },
    };

    public Task<WineData?> GetByBarcodeAsync(string barcode, CancellationToken ct = default)
        => Task.FromResult(Wines.GetValueOrDefault(barcode));
}
