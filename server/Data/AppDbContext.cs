using Microsoft.EntityFrameworkCore;
using WineApp.Api.Models;

namespace WineApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<CellarEntry> CellarEntries => Set<CellarEntry>();
    public DbSet<WineData> WineData => Set<WineData>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CellarEntry>().HasKey(e => new { e.UserId, e.Barcode });

        modelBuilder.Entity<WineData>(entity =>
        {
            entity.HasKey(e => e.Barcode);
            entity.Property(e => e.Grapes).HasColumnType("text[]");
            entity.Property(e => e.Pairings).HasColumnType("text[]");
        });
    }
}
