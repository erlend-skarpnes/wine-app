using Microsoft.EntityFrameworkCore;
using WineApp.Api.Models;

namespace WineApp.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Home> Homes => Set<Home>();
    public DbSet<HomeMember> HomeMembers => Set<HomeMember>();
    public DbSet<HomeShareToken> HomeShareTokens => Set<HomeShareToken>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Entry> Entries => Set<Entry>();
    public DbSet<WineData> WineData => Set<WineData>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Invitation> Invitations => Set<Invitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Entry>()
            .HasKey(e => e.Id);

        modelBuilder.Entity<Entry>()
            .HasOne(e => e.Home)
            .WithMany()
            .HasForeignKey(e => e.HomeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Entry>()
            .HasOne(e => e.Location)
            .WithMany(l => l.Entries)
            .HasForeignKey(e => e.LocationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired(false);

        modelBuilder.Entity<Entry>()
            .HasOne(e => e.Section)
            .WithMany(s => s.Entries)
            .HasForeignKey(e => e.SectionId)
            .OnDelete(DeleteBehavior.SetNull);

        // At most one unlocated entry per barcode per home
        modelBuilder.Entity<Entry>()
            .HasIndex(e => new { e.HomeId, e.Barcode })
            .IsUnique()
            .HasFilter("\"LocationId\" IS NULL");

        // At most one entry per barcode per location
        modelBuilder.Entity<Entry>()
            .HasIndex(e => new { e.HomeId, e.Barcode, e.LocationId })
            .IsUnique()
            .HasFilter("\"LocationId\" IS NOT NULL");

        modelBuilder.Entity<Home>()
            .HasOne(h => h.Owner)
            .WithMany()
            .HasForeignKey(h => h.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<HomeMember>()
            .HasKey(m => new { m.HomeId, m.UserId });

        modelBuilder.Entity<HomeMember>()
            .HasOne(m => m.Home)
            .WithMany(h => h.Members)
            .HasForeignKey(m => m.HomeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<HomeMember>()
            .HasOne(m => m.User)
            .WithMany(u => u.HomeMemberships)
            .HasForeignKey(m => m.UserId);

        modelBuilder.Entity<HomeShareToken>()
            .HasIndex(t => t.Token).IsUnique();

        modelBuilder.Entity<HomeShareToken>()
            .HasOne(t => t.Home)
            .WithMany(h => h.ShareTokens)
            .HasForeignKey(t => t.HomeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Location>()
            .HasOne(l => l.Home)
            .WithMany(h => h.Locations)
            .HasForeignKey(l => l.HomeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Section>()
            .HasOne(s => s.Location)
            .WithMany(l => l.Sections)
            .HasForeignKey(s => s.LocationId)
            .OnDelete(DeleteBehavior.Cascade);

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
    }
}
