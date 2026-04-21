using Microsoft.EntityFrameworkCore;
using WineApp.Api.Data;
using WineApp.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
    ?? ["http://localhost:3000", "http://localhost:5173"];

builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

// Initialize database on startup.
// Switch to db.Database.Migrate() once you generate EF migrations.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    await SeedData.InitializeAsync(db);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();

app.MapWineEndpoints();
app.MapCellarEndpoints();
app.MapLabelEndpoints();
app.MapRecommendationEndpoints();

app.Run();
