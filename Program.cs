using Betonator.Auth;
using Betonator.Data;
using Betonator.Endpoints;
using Betonator.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings:Default is not configured.");

builder.Services.AddDbContext<BetonatorDbContext>(opt =>
    opt.UseNpgsql(connectionString));

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

await DbInitializer.EnsureSeededAsync(app.Services);

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
