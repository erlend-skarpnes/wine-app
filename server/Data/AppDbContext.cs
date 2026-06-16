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
    public DbSet<DrinkLog> DrinkLogs => Set<DrinkLog>();
    public DbSet<FavoriteWine> FavoriteWines => Set<FavoriteWine>();
    public DbSet<WineNote> WineNotes => Set<WineNote>();
    public DbSet<WineSample> WineSamples => Set<WineSample>();

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

        modelBuilder.Entity<DrinkLog>()
            .HasOne(d => d.User)
            .WithMany()
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<DrinkLog>()
            .HasOne(d => d.Home)
            .WithMany()
            .HasForeignKey(d => d.HomeId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<FavoriteWine>()
            .HasIndex(f => new { f.UserId, f.Barcode })
            .IsUnique();

        modelBuilder.Entity<FavoriteWine>()
            .HasOne(f => f.User)
            .WithMany()
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineNote>()
            .HasIndex(n => new { n.UserId, n.Barcode })
            .IsUnique();

        modelBuilder.Entity<WineNote>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WineSample>(entity =>
        {
            entity.Property(e => e.LabelGrapes).HasColumnType("text[]");
            entity.Property(e => e.LabelPairings).HasColumnType("text[]");
        });

        modelBuilder.Entity<WineSample>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);
    }
}
