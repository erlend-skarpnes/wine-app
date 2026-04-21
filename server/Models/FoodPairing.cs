namespace WineApp.Api.Models;

public class FoodPairing
{
    public int Id { get; set; }
    public required string Varietal { get; set; }
    public required string FoodItem { get; set; }
    public string? Notes { get; set; }
}
