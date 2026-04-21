using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;

namespace WineApp.Api.Endpoints;

public static class RecommendationEndpoints
{
    public static void MapRecommendationEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/recommendations").WithTags("Recommendations");

        // GET /api/recommendations?foods=steak&foods=pasta
        group.MapGet("/", async (string[]? foods, AppDbContext db) =>
        {
            if (foods is null || foods.Length == 0)
            {
                var all = await db.CellarEntries
                    .Include(e => e.Wine)
                    .Where(e => e.Quantity > 0)
                    .ToListAsync();

                return Results.Ok(all.Select(e => new { wine = e.Wine, cellarEntry = e, reason = "In stock" }));
            }

            var lowerFoods = foods.Select(f => f.ToLower()).ToList();

            // Load all pairings into memory — table stays small
            var allPairings = await db.FoodPairings.ToListAsync();
            var matched = allPairings
                .Where(p => lowerFoods.Any(f =>
                    p.FoodItem.ToLower().Contains(f) || f.Contains(p.FoodItem.ToLower())))
                .ToList();

            if (matched.Count == 0)
                return Results.Ok(Array.Empty<object>());

            var varietalReasons = matched
                .GroupBy(p => p.Varietal)
                .ToDictionary(
                    g => g.Key,
                    g => $"Pairs with {string.Join(", ", g.Select(p => p.FoodItem))}");

            var matchingVarietals = varietalReasons.Keys.ToList();
            var entries = await db.CellarEntries
                .Include(e => e.Wine)
                .Where(e => e.Quantity > 0 && matchingVarietals.Contains(e.Wine.Varietal))
                .ToListAsync();

            return Results.Ok(entries.Select(e => new
            {
                wine = e.Wine,
                cellarEntry = e,
                reason = varietalReasons.GetValueOrDefault(e.Wine.Varietal, "Good pairing")
            }));
        });
    }
}
