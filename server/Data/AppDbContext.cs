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
    public DbSet<Cellar> Cellars => Set<Cellar>();
    public DbSet<CellarMember> CellarMembers => Set<CellarMember>();
    public DbSet<CellarShareToken> CellarShareTokens => Set<CellarShareToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CellarEntry>()
            .HasKey(e => new { e.CellarId, e.Barcode });

        modelBuilder.Entity<CellarEntry>()
            .HasOne(e => e.Cellar)
            .WithMany(c => c.Entries)
            .HasForeignKey(e => e.CellarId);

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

        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId);

        modelBuilder.Entity<Invitation>()
            .HasIndex(i => i.Token).IsUnique();

        modelBuilder.Entity<Cellar>()
            .HasOne(c => c.Owner)
            .WithMany()
            .HasForeignKey(c => c.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CellarMember>()
            .HasKey(m => new { m.CellarId, m.UserId });

        modelBuilder.Entity<CellarMember>()
            .HasOne(m => m.Cellar)
            .WithMany(c => c.Members)
            .HasForeignKey(m => m.CellarId);

        modelBuilder.Entity<CellarMember>()
            .HasOne(m => m.User)
            .WithMany(u => u.CellarMemberships)
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<CellarShareToken>()
            .HasIndex(t => t.Token).IsUnique();

        modelBuilder.Entity<CellarShareToken>()
            .HasOne(t => t.Cellar)
            .WithMany(c => c.ShareTokens)
            .HasForeignKey(t => t.CellarId);
    }
}
