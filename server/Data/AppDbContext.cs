using Microsoft.EntityFrameworkCore;
using WineApp.Api.Models;

namespace WineApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Wine> Wines => Set<Wine>();
    public DbSet<CellarEntry> CellarEntries => Set<CellarEntry>();
    public DbSet<FoodPairing> FoodPairings => Set<FoodPairing>();
}
