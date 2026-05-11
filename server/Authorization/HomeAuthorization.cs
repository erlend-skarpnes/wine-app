using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;

namespace WineApp.Api.Authorization;

public static class HomeAuthorization
{
    public static async Task<bool> IsMember(int userId, int homeId, AppDbContext db) =>
        await db.HomeMembers.AnyAsync(m => m.HomeId == homeId && m.UserId == userId);

    public static async Task<bool> IsOwner(int userId, int homeId, AppDbContext db) =>
        await db.Homes.AnyAsync(h => h.Id == homeId && h.OwnerId == userId);
}
