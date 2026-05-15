using WineApp.Api.Models;

namespace WineApp.Api.Services;

public record AdjustResult(Entry Entry, int QuantityRemoved);

public class NothingToRemoveException() : Exception("Nothing to remove.");
public class LocationNotFoundException() : Exception("Location not found.");

public interface IStockAdjuster
{
    Task<AdjustResult> AdjustAsync(int homeId, int userId, string barcode, int delta, int? locationId, int? sectionId);
}
