using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class FakeWineApiService : IWineApiService
{
    public Task<WineIdentifyResult> IdentifyAsync(Stream imageStream, string contentType, CancellationToken ct = default)
        => Task.FromResult(new WineIdentifyResult { WineId = "fake-wine-id", Confidence = 0.99 });

    public Task<WineData> GetDetailAsync(string wineApiId, string barcode, CancellationToken ct = default)
        => Task.FromResult(new WineData
        {
            Barcode = barcode,
            ProductCode = wineApiId,
            Name = "Identifisert testvin",
            Type = "Rødvin",
        });
}
