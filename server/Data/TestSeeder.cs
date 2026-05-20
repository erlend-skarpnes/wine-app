using WineApp.Api.Models;

namespace WineApp.Api.Data;

public static class TestSeeder
{
    public static async Task SeedAsync(AppDbContext db)
    {
        db.WineData.AddRange(
            new WineData { Barcode = "7090016664323", ProductCode = "7090016664323", Name = "Testvinen", Type = "Rødvin" },
            new WineData { Barcode = "7090016460692", ProductCode = "7090016460692", Name = "Testvin 2", Type = "Hvitvin" }
        );
        await db.SaveChangesAsync();

        var admin    = new AppUser { Username = "testadmin",   PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!"), IsAdmin = true };
        var user     = new AppUser { Username = "testuser",    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!") };
        var lockUser = new AppUser { Username = "testlockout", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Test1234!") };
        db.Users.AddRange(admin, user, lockUser);
        await db.SaveChangesAsync();

        var home  = new Home { Name = "Testhjemmet",  OwnerId = user.Id, CreatedAt = DateTime.UtcNow };
        var home2 = new Home { Name = "Testhjemmet2", OwnerId = user.Id, CreatedAt = DateTime.UtcNow };
        db.Homes.AddRange(home, home2);
        await db.SaveChangesAsync();

        db.HomeMembers.AddRange(
            new HomeMember { HomeId = home.Id,  UserId = user.Id, JoinedAt = DateTime.UtcNow },
            new HomeMember { HomeId = home2.Id, UserId = user.Id, JoinedAt = DateTime.UtcNow }
        );
        var loc     = new Location { Name = "Standard",  HomeId = home.Id,  CreatedAt = DateTime.UtcNow };
        var locCool = new Location { Name = "Kjøleskap", HomeId = home.Id,  CreatedAt = DateTime.UtcNow };
        db.Locations.AddRange(loc, locCool);
        await db.SaveChangesAsync();

        db.Sections.Add(new Section { Name = "Hylle A", LocationId = locCool.Id, CreatedAt = DateTime.UtcNow });

        db.Entries.AddRange(
            new Entry { HomeId = home.Id, LocationId = loc.Id,     Barcode = "7090016664323", Quantity = 3 },
            new Entry { HomeId = home.Id, LocationId = loc.Id,     Barcode = "7090016460692", Quantity = 1 },
            new Entry { HomeId = home.Id, LocationId = locCool.Id, Barcode = "7090016664323", Quantity = 2 }
        );
        await db.SaveChangesAsync();

        var adminHome = new Home { Name = "Adminhjemmet", OwnerId = admin.Id, CreatedAt = DateTime.UtcNow };
        db.Homes.Add(adminHome);
        await db.SaveChangesAsync();

        var adminLoc = new Location { Name = "Standard", HomeId = adminHome.Id, CreatedAt = DateTime.UtcNow };
        db.Locations.Add(adminLoc);
        db.HomeMembers.Add(new HomeMember { HomeId = adminHome.Id, UserId = admin.Id, JoinedAt = DateTime.UtcNow });
        await db.SaveChangesAsync();

        db.Entries.Add(new Entry { HomeId = adminHome.Id, LocationId = adminLoc.Id, Barcode = "7090016664323", Quantity = 2 });
        await db.SaveChangesAsync();
    }
}
