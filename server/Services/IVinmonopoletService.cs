using WineApp.Api.Models;

namespace WineApp.Api.Services;

public interface IVinmonopoletService
{
    Task<WineData?> GetByBarcodeAsync(string barcode, CancellationToken ct = default);
}
