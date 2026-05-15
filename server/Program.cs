using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Testcontainers.PostgreSql;
using WineApp.Api.Data;
using WineApp.Api.Endpoints;
using WineApp.Api.Models;
using WineApp.Api.Queries;
using WineApp.Api.Services;

var builder = WebApplication.CreateBuilder(args);

IAsyncDisposable? testContainer = null;
if (builder.Environment.IsEnvironment("Testing"))
{
    var pg = new PostgreSqlBuilder()
        .WithDatabase("wineapp_test")
        .WithUsername("wineapp")
        .WithPassword("wineapp")
        .Build();
    await pg.StartAsync();
    testContainer = pg;
    builder.Configuration["ConnectionStrings:DefaultConnection"] = pg.GetConnectionString();
}

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddSingleton<IVinmonopoletService, FakeVinmonopoletService>();
    builder.Services.AddSingleton<IWineApiService, FakeWineApiService>();
}
else
{
    builder.Services.AddHttpClient<IVinmonopoletService, VinmonopoletService>((serviceProvider, client) =>
    {
        var config = serviceProvider.GetRequiredService<IConfiguration>();
        client.BaseAddress = new Uri(config["Vinmonopolet:BaseUrl"] ?? "https://app.vinmonopolet.no/vmpws/v2/vmp/");
    });

    builder.Services.AddHttpClient<IWineApiService, WineApiService>((serviceProvider, client) =>
    {
        var config = serviceProvider.GetRequiredService<IConfiguration>();
        client.BaseAddress = new Uri(config["WineApi:BaseUrl"] ?? "http://api.wineapi.io/");
        var apiKey = config["WineApi:ApiKey"];
        if (!string.IsNullOrEmpty(apiKey))
            client.DefaultRequestHeaders.Add("X-API-Key", apiKey);
    });
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var secret = builder.Configuration["JwtSecret"]
            ?? throw new InvalidOperationException("JwtSecret not configured");

        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "vinkjelleren",
            ValidateAudience = false,
            ValidateLifetime = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
        };

        // Read JWT from HttpOnly cookie instead of Authorization header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                ctx.Token = ctx.Request.Cookies["access_token"];
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", policy =>
        policy.RequireAuthenticatedUser()
              .RequireClaim("isAdmin", "true"));
});

builder.Services.AddScoped<IStockQuery, StockQuery>();
builder.Services.AddScoped<IWineIdentifier, WineIdentifier>();
builder.Services.AddScoped<IWineResolver, WineResolver>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:3333", "http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();

    if (app.Environment.IsEnvironment("Testing") && !db.Users.Any())
    {
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
    }
}

if (testContainer is not null)
{
    app.Lifetime.ApplicationStopping.Register(() =>
        testContainer.DisposeAsync().AsTask().GetAwaiter().GetResult());
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.MapGet("/health", () => Results.Ok());
app.UseAuthentication();
app.UseAuthorization();

app.MapAuthEndpoints();
app.MapAdminEndpoints();
app.MapHomeEndpoints();
app.MapLocationEndpoints();
app.MapEntryEndpoints();
app.MapWineEndpoints();
app.MapHistoryEndpoints();
app.MapFavoritesEndpoints();

app.Run();
