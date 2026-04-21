using Microsoft.EntityFrameworkCore;
using WineApp.Api.Models;

namespace WineApp.Api.Data;

public static class SeedData
{
    public static async Task InitializeAsync(AppDbContext db)
    {
        if (await db.FoodPairings.AnyAsync()) return;

        db.FoodPairings.AddRange(
            new FoodPairing { Varietal = "Cabernet Sauvignon", FoodItem = "Red meat" },
            new FoodPairing { Varietal = "Cabernet Sauvignon", FoodItem = "Lamb" },
            new FoodPairing { Varietal = "Cabernet Sauvignon", FoodItem = "Hard cheese" },
            new FoodPairing { Varietal = "Merlot", FoodItem = "Beef" },
            new FoodPairing { Varietal = "Merlot", FoodItem = "Pork" },
            new FoodPairing { Varietal = "Merlot", FoodItem = "Pasta" },
            new FoodPairing { Varietal = "Pinot Noir", FoodItem = "Duck" },
            new FoodPairing { Varietal = "Pinot Noir", FoodItem = "Salmon" },
            new FoodPairing { Varietal = "Pinot Noir", FoodItem = "Mushrooms" },
            new FoodPairing { Varietal = "Chardonnay", FoodItem = "Seafood" },
            new FoodPairing { Varietal = "Chardonnay", FoodItem = "Chicken" },
            new FoodPairing { Varietal = "Chardonnay", FoodItem = "Creamy pasta" },
            new FoodPairing { Varietal = "Sauvignon Blanc", FoodItem = "Salad" },
            new FoodPairing { Varietal = "Sauvignon Blanc", FoodItem = "Goat cheese" },
            new FoodPairing { Varietal = "Sauvignon Blanc", FoodItem = "Shellfish" },
            new FoodPairing { Varietal = "Riesling", FoodItem = "Spicy food" },
            new FoodPairing { Varietal = "Riesling", FoodItem = "Asian cuisine" },
            new FoodPairing { Varietal = "Riesling", FoodItem = "Pork" },
            new FoodPairing { Varietal = "Syrah", FoodItem = "Grilled meat" },
            new FoodPairing { Varietal = "Syrah", FoodItem = "Game" },
            new FoodPairing { Varietal = "Syrah", FoodItem = "Sausages" },
            new FoodPairing { Varietal = "Champagne", FoodItem = "Oysters" },
            new FoodPairing { Varietal = "Champagne", FoodItem = "Caviar" },
            new FoodPairing { Varietal = "Champagne", FoodItem = "Fried food" }
        );

        await db.SaveChangesAsync();
    }
}
