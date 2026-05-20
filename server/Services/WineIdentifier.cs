using WineApp.Api.Models;

namespace WineApp.Api.Services;

public class WineIdentifier(IWineApiService wineApi, IWineCache wineCache) : IWineIdentifier
{
    public async Task<IdentifyOutcome> IdentifyAsync(string barcode, Stream image, string contentType)
    {
        var result = await wineApi.IdentifyAsync(image, contentType);
        if (result.WineId is not null)
        {
            var wine = await wineApi.GetDetailAsync(result.WineId, barcode);
            await wineCache.StoreAsync(wine);
            return new WineIdentified(wine);
        }
        return new WineSuggestions(result.Suggestions);
    }

    public async Task<WineData> LinkAsync(string barcode, string productCode)
    {
        var wine = await wineApi.GetDetailAsync(productCode, barcode);
        await wineCache.StoreAsync(wine);
        return wine;
    }
}
