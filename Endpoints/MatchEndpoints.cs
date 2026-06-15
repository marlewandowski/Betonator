using System.Security.Claims;
using Betonator.Data;
using Betonator.Domain;
using Betonator.Dtos;
using Betonator.Services;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class MatchEndpoints
{
    public static IEndpointRouteBuilder MapMatchEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/competitions/{id:int}/matches", async (int id, ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == id);
            if (!compExists) return Results.NotFound();

            var uid = principal.UserId();
            var matches = await db.Matches
                .Where(m => m.CompetitionId == id)
                .OrderBy(m => m.GameTime)
                .Select(m => new
                {
                    Match = m,
                    MyBet = m.Bets.FirstOrDefault(b => b.UserId == uid),
                })
                .ToListAsync();

            var dtos = matches.Select(x =>
            {
                BetDto? myBetDto = x.MyBet is null
                    ? null
                    : x.MyBet.ToDto(principal.Identity?.Name ?? "");
                return x.Match.ToDto(myBetDto);
            });
            return Results.Ok(dtos);
        }).RequireAuthorization();

        app.MapPost("/matches", async (CreateMatchRequest req, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == req.CompetitionId);
            if (!compExists) return Results.NotFound(new { error = "Competition not found." });

            if (string.IsNullOrWhiteSpace(req.Team1) || string.IsNullOrWhiteSpace(req.Team2))
                return Results.BadRequest(new { error = "Both teams are required." });

            var (groupId, stage, validationError) = await ValidateStagePlacement(
                req.CompetitionId, req.GroupId, req.Stage, req.FeederMatch1Id, req.FeederMatch2Id, null, db);
            if (validationError is not null) return validationError;

            var m = new Match
            {
                CompetitionId = req.CompetitionId,
                GameTime = DateTime.SpecifyKind(req.GameTime, DateTimeKind.Utc),
                Team1 = req.Team1,
                Team2 = req.Team2,
                Description = req.Description,
                GroupId = groupId,
                Stage = stage,
                BracketPosition = req.BracketPosition,
                FeederMatch1Id = req.FeederMatch1Id,
                FeederMatch2Id = req.FeederMatch2Id,
            };
            db.Matches.Add(m);
            await db.SaveChangesAsync();
            return Results.Created($"/api/matches/{m.Id}", m.ToDto(null));
        }).RequireAuthorization("Admin");

        app.MapPut("/matches/{id:int}", async (int id, UpdateMatchRequest req, BetonatorDbContext db) =>
        {
            var m = await db.Matches.FindAsync(id);
            if (m is null) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(req.Team1) || string.IsNullOrWhiteSpace(req.Team2))
                return Results.BadRequest(new { error = "Both teams are required." });

            var (groupId, stage, validationError) = await ValidateStagePlacement(
                m.CompetitionId, req.GroupId, req.Stage, req.FeederMatch1Id, req.FeederMatch2Id, id, db);
            if (validationError is not null) return validationError;

            m.GameTime = DateTime.SpecifyKind(req.GameTime, DateTimeKind.Utc);
            m.Team1 = req.Team1;
            m.Team2 = req.Team2;
            m.Description = req.Description;
            m.GroupId = groupId;
            m.Stage = stage;
            m.BracketPosition = req.BracketPosition;
            m.FeederMatch1Id = req.FeederMatch1Id;
            m.FeederMatch2Id = req.FeederMatch2Id;
            await db.SaveChangesAsync();
            return Results.Ok(m.ToDto(null));
        }).RequireAuthorization("Admin");

        app.MapPost("/matches/{id:int}/result", async (int id, SetResultRequest req, BetonatorDbContext db, IScoringRule scoring) =>
        {
            var m = await db.Matches.Include(x => x.Bets).FirstOrDefaultAsync(x => x.Id == id);
            if (m is null) return Results.NotFound();

            await using var tx = await db.Database.BeginTransactionAsync();
            m.Goal1 = req.Goal1;
            m.Goal2 = req.Goal2;
            m.ResultDescription = req.ResultDescription;

            foreach (var bet in m.Bets)
            {
                bet.Points = scoring.Score(req.Goal1, req.Goal2, bet.BetGoal1, bet.BetGoal2);
            }

            await db.SaveChangesAsync();
            await tx.CommitAsync();

            return Results.Ok(m.ToDto(null));
        }).RequireAuthorization("Admin");

        app.MapDelete("/matches/{id:int}/result", async (int id, BetonatorDbContext db) =>
        {
            var m = await db.Matches.Include(x => x.Bets).FirstOrDefaultAsync(x => x.Id == id);
            if (m is null) return Results.NotFound();

            m.Goal1 = null;
            m.Goal2 = null;
            m.ResultDescription = null;
            foreach (var bet in m.Bets) bet.Points = null;

            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("Admin");

        app.MapGet("/matches/{id:int}/bets", async (int id, ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            var m = await db.Matches.FindAsync(id);
            if (m is null) return Results.NotFound();

            var uid = principal.UserId();
            var hasOwnBet = await db.Bets.AnyAsync(b => b.MatchId == id && b.UserId == uid);
            var matchStarted = m.GameTime <= DateTime.UtcNow;
            if (!principal.IsAdmin() && !hasOwnBet && !matchStarted)
            {
                return Results.Json(
                    new { error = "Place your bet first to see other users' bets." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var bets = await db.Bets
                .Where(b => b.MatchId == id)
                .Include(b => b.User)
                .OrderBy(b => b.User.Username)
                .ToListAsync();

            return Results.Ok(bets.Select(b => b.ToDto(b.User.Username)));
        }).RequireAuthorization();

        return app;
    }

    /// <summary>
    /// Enforces: a match belongs to either a Group (Stage=Group) or an elimination stage
    /// (Stage != Group, GroupId null). Feeder matches must belong to the same competition.
    /// </summary>
    private static async Task<(int? GroupId, MatchStage? Stage, IResult? Error)> ValidateStagePlacement(
        int competitionId, int? groupId, MatchStage? stage, int? feeder1Id, int? feeder2Id, int? selfId,
        BetonatorDbContext db)
    {
        if (groupId.HasValue)
        {
            var groupOk = await db.Groups.AnyAsync(g => g.Id == groupId.Value && g.CompetitionId == competitionId);
            if (!groupOk) return (null, null, Results.BadRequest(new { error = "Group not found in this competition." }));
            if (stage.HasValue && stage.Value != MatchStage.Group)
                return (null, null, Results.BadRequest(new { error = "Group matches must have Stage=Group (or omit stage)." }));
            if (feeder1Id.HasValue || feeder2Id.HasValue)
                return (null, null, Results.BadRequest(new { error = "Group matches cannot have feeder matches." }));
            return (groupId, MatchStage.Group, null);
        }

        if (stage.HasValue && stage.Value == MatchStage.Group)
            return (null, null, Results.BadRequest(new { error = "Stage=Group requires a GroupId." }));

        foreach (var feederId in new[] { feeder1Id, feeder2Id })
        {
            if (!feederId.HasValue) continue;
            if (feederId == selfId)
                return (null, null, Results.BadRequest(new { error = "A match cannot feed itself." }));
            var feederOk = await db.Matches.AnyAsync(m => m.Id == feederId && m.CompetitionId == competitionId);
            if (!feederOk)
                return (null, null, Results.BadRequest(new { error = $"Feeder match #{feederId} not found in this competition." }));
        }

        return (null, stage, null);
    }
}
