namespace WineApp.Api.Queries;

public record LocationStock(int LocationId, string LocationName, int? SectionId, string? SectionName, int Quantity);

public record AggregatedStock(string Barcode, int Quantity, string? Name, string? Type,
    string[] Pairings, string[] Grapes, string? StoragePotential,
    double? AlcoholContent, List<LocationStock> Locations);

public interface IStockQuery
{
    Task<List<AggregatedStock>> GetAggregatedAsync(int homeId);
    Task<List<LocationStock>> GetLocationsAsync(int homeId, string barcode);
}
