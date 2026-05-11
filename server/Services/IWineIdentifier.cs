using WineApp.Api.Models;

namespace WineApp.Api.Services;

public abstract record IdentifyOutcome;
public record WineIdentified(WineData Wine) : IdentifyOutcome;
public record WineSuggestions(WineSuggestion[] Suggestions) : IdentifyOutcome;

public interface IWineIdentifier
{
    Task<IdentifyOutcome> IdentifyAsync(string barcode, Stream image, string contentType);
    Task<WineData> LinkAsync(string barcode, string productCode);
}
