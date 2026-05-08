using WineApp.Api.Models;

namespace WineApp.Api.Services;

public interface IWineApiService
{
    Task<WineIdentifyResult> IdentifyAsync(Stream imageStream, string contentType, CancellationToken ct = default);
    Task<WineData> GetDetailAsync(string wineApiId, string barcode, CancellationToken ct = default);
}
