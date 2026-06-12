using System.Security.Claims;
using Betonator.Data;
using Betonator.Domain;
using Betonator.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class CompetitionEndpoints
{
    public static IEndpointRouteBuilder MapCompetitionEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/competitions", async (ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            var query = db.Competitions.AsQueryable();
            if (!principal.IsAdmin())
            {
                var uid = principal.UserId();
                query = query.Where(c => c.Participants.Any(p => p.UserId == uid && p.IsActive));
            }

            var rows = await query
                .OrderByDescending(c => c.CreatedAt)
                .Select(c => new CompetitionDto(
                    c.Id, c.Name, c.IsInternational, c.CreatedAt,
                    c.Matches.Count, c.Participants.Count(p => p.IsActive)))
                .ToListAsync();

            return Results.Ok(rows);
        }).RequireAuthorization();

        app.MapPost("/competitions", async (CreateCompetitionRequest req, ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { error = "Name is required." });

            var c = new Competition { Name = req.Name, IsInternational = req.IsInternational };
            db.Competitions.Add(c);
            await db.SaveChangesAsync();

            db.CompetitionParticipants.Add(new CompetitionParticipant
            {
                CompetitionId = c.Id,
                UserId = principal.UserId(),
                IsActive = true,
            });
            await db.SaveChangesAsync();

            return Results.Created($"/competitions/{c.Id}", c.ToDto(0, 1));
        }).RequireAuthorization("Admin");

        app.MapPut("/competitions/{id:int}", async (int id, UpdateCompetitionRequest req, BetonatorDbContext db) =>
        {
            var c = await db.Competitions.FindAsync(id);
            if (c is null) return Results.NotFound();
            c.Name = req.Name;
            c.IsInternational = req.IsInternational;
            await db.SaveChangesAsync();

            var matchCount = await db.Matches.CountAsync(m => m.CompetitionId == id);
            var partCount = await db.CompetitionParticipants.CountAsync(p => p.CompetitionId == id && p.IsActive);
            return Results.Ok(c.ToDto(matchCount, partCount));
        }).RequireAuthorization("Admin");

        app.MapGet("/competitions/{id:int}/participants", async (int id, BetonatorDbContext db) =>
        {
            var rows = await db.CompetitionParticipants
                .Where(p => p.CompetitionId == id)
                .OrderBy(p => p.User.Username)
                .Select(p => new ParticipantDto(p.UserId, p.User.Username, p.IsActive))
                .ToListAsync();
            return Results.Ok(rows);
        }).RequireAuthorization();

        app.MapPost("/competitions/{id:int}/participants", async (int id, AddParticipantRequest req, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == id);
            if (!compExists) return Results.NotFound(new { error = "Competition not found." });

            var userExists = await db.Users.AnyAsync(u => u.Id == req.UserId);
            if (!userExists) return Results.NotFound(new { error = "User not found." });

            var existing = await db.CompetitionParticipants
                .FirstOrDefaultAsync(p => p.CompetitionId == id && p.UserId == req.UserId);
            if (existing is null)
            {
                db.CompetitionParticipants.Add(new CompetitionParticipant
                {
                    CompetitionId = id,
                    UserId = req.UserId,
                    IsActive = req.IsActive,
                });
            }
            else
            {
                existing.IsActive = req.IsActive;
            }

            await db.SaveChangesAsync();
            var u = await db.Users.FindAsync(req.UserId);
            return Results.Ok(new ParticipantDto(req.UserId, u!.Username, req.IsActive));
        }).RequireAuthorization("Admin");

        app.MapDelete("/competitions/{id:int}/participants/{userId:int}", async (int id, int userId, BetonatorDbContext db) =>
        {
            var p = await db.CompetitionParticipants
                .FirstOrDefaultAsync(x => x.CompetitionId == id && x.UserId == userId);
            if (p is null) return Results.NotFound();
            db.CompetitionParticipants.Remove(p);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("Admin");

        app.MapGet("/competitions/{id:int}/standings", async (int id, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == id);
            if (!compExists) return Results.NotFound();

            var rows = await db.CompetitionParticipants
                .Where(p => p.CompetitionId == id)
                .Select(p => new
                {
                    p.UserId,
                    p.User.Username,
                    p.IsActive,
                    Bets = p.User.Bets.Where(b => b.Match.CompetitionId == id).ToList(),
                })
                .ToListAsync();

            var standings = rows
                .Select(r =>
                {
                    var pts = r.Bets.Sum(b => b.Points ?? 0);
                    var betsPlaced = r.Bets.Count;
                    var exact = r.Bets.Count(b => b.Points == 5);
                    var correctOutcome = r.Bets.Count(b => b.Points >= 3);
                    return new StandingsRowDto(r.UserId, r.Username, pts, betsPlaced, exact, correctOutcome);
                })
                .OrderByDescending(s => s.Points)
                .ThenByDescending(s => s.ExactScores)
                .ThenBy(s => s.Username)
                .ToList();

            return Results.Ok(standings);
        }).RequireAuthorization();

        return app;
    }
}
