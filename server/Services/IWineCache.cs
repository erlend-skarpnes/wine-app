using WineApp.Api.Models;

namespace WineApp.Api.Services;

public interface IWineCache
{
    Task StoreAsync(WineData wine);
}
