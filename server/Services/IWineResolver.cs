using WineApp.Api.Models;

namespace WineApp.Api.Services;

public interface IWineResolver
{
    Task<WineData?> GetAsync(string barcode);
}
