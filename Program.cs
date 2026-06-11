using Betonator.Auth;
using Betonator.Data;
using Betonator.Endpoints;
using Betonator.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// builder.Services.AddOpenApi();

var dataDir = "/app/data";
Directory.CreateDirectory(dataDir);

var dbPath = Path.Combine(dataDir, "betonator.db");
var seedPath = Path.Combine(AppContext.BaseDirectory, "Data", "seed.db");

if (!File.Exists(dbPath))
{
    if (!File.Exists(seedPath))
        throw new Exception($"Seed DB not found at {seedPath}");

    File.Copy(seedPath, dbPath);
}

builder.Services.AddDbContext<BetonatorDbContext>(opt =>
    opt.UseSqlite($"Data Source={dbPath}"));

builder.Services.AddBetonatorAuth(builder.Configuration);
builder.Services.AddSingleton<IScoringRule, ClassicPolishTyperRule>();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(o => o.AddPolicy("ClientApp", p =>
        p.WithOrigins("http://localhost:4200")
         .AllowAnyHeader()
         .AllowAnyMethod()));
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    // app.MapOpenApi();
    app.UseCors("ClientApp");
}

app.UseBetonatorAuth();

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");
api.MapAuthEndpoints();
api.MapUserEndpoints();
api.MapCompetitionEndpoints();
api.MapGroupEndpoints();
api.MapMatchEndpoints();
api.MapBetEndpoints();

app.MapFallbackToFile("index.html");

app.Run();

