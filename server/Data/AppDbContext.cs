using Microsoft.EntityFrameworkCore;
using WineApp.Api.Models;

namespace WineApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<CellarEntry> CellarEntries => Set<CellarEntry>();
    public DbSet<WineData> WineData => Set<WineData>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Invitation> Invitations => Set<Invitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CellarEntry>().HasKey(e => new { e.UserId, e.Barcode });

        modelBuilder.Entity<WineData>(entity =>
        {
            entity.HasKey(e => e.Barcode);
            entity.Property(e => e.Grapes).HasColumnType("text[]");
            entity.Property(e => e.Pairings).HasColumnType("text[]");
        });

        modelBuilder.Entity<AppUser>()
            .HasIndex(u => u.Username).IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasIndex(r => r.Token).IsUnique();

        modelBuilder.Entity<Invitation>()
            .HasIndex(i => i.Token).IsUnique();

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId);
    }
}
