using System.Security.Claims;
using Betonator.Data;
using Betonator.Domain;
using Betonator.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class BetEndpoints
{
    public static IEndpointRouteBuilder MapBetEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapPut("/matches/{matchId:int}/bet", async (int matchId, UpsertBetRequest req, ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            if (req.Goal1 < 0 || req.Goal2 < 0 || req.Goal1 > 99 || req.Goal2 > 99)
            {
                return Results.BadRequest(new { error = "Goals must be between 0 and 99." });
            }

            var uid = principal.UserId();
            var match = await db.Matches.FindAsync(matchId);
            if (match is null) return Results.NotFound(new { error = "Match not found." });
            if (match.IsLocked) return Results.Conflict(new { error = "Match is locked — bets are closed." });

            var participates = await db.CompetitionParticipants
                .AnyAsync(p => p.CompetitionId == match.CompetitionId && p.UserId == uid && p.IsActive);
            if (!participates)
            {
                return Results.Json(
                    new { error = "You are not an active participant of this competition." },
                    statusCode: StatusCodes.Status403Forbidden);
            }

            var bet = await db.Bets.FirstOrDefaultAsync(b => b.MatchId == matchId && b.UserId == uid);
            var now = DateTime.UtcNow;
            if (bet is null)
            {
                bet = new Bet
                {
                    MatchId = matchId,
                    UserId = uid,
                    BetGoal1 = req.Goal1,
                    BetGoal2 = req.Goal2,
                    PlacedAt = now,
                    UpdatedAt = now,
                };
                db.Bets.Add(bet);
            }
            else
            {
                bet.BetGoal1 = req.Goal1;
                bet.BetGoal2 = req.Goal2;
                bet.UpdatedAt = now;
            }

            await db.SaveChangesAsync();
            var username = principal.Identity?.Name ?? "";
            return Results.Ok(bet.ToDto(username));
        }).RequireAuthorization();

        app.MapGet("/me/bets", async (int? competitionId, ClaimsPrincipal principal, BetonatorDbContext db) =>
        {
            var uid = principal.UserId();
            var query = db.Bets.Where(b => b.UserId == uid);
            if (competitionId.HasValue)
            {
                query = query.Where(b => b.Match.CompetitionId == competitionId.Value);
            }

            var bets = await query
                .Include(b => b.User)
                .OrderByDescending(b => b.UpdatedAt)
                .ToListAsync();

            return Results.Ok(bets.Select(b => b.ToDto(b.User.Username)));
        }).RequireAuthorization();

        return app;
    }
}
