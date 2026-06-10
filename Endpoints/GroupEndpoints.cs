using Betonator.Data;
using Betonator.Domain;
using Betonator.Dtos;
using Microsoft.EntityFrameworkCore;

namespace Betonator.Endpoints;

public static class GroupEndpoints
{
    public static IEndpointRouteBuilder MapGroupEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/competitions/{competitionId:int}/groups", async (int competitionId, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == competitionId);
            if (!compExists) return Results.NotFound();
            var rows = await db.Groups
                .Where(g => g.CompetitionId == competitionId)
                .OrderBy(g => g.DisplayOrder).ThenBy(g => g.Name)
                .Select(g => g.ToDto())
                .ToListAsync();
            return Results.Ok(rows);
        }).RequireAuthorization();

        app.MapPost("/competitions/{competitionId:int}/groups", async (int competitionId, CreateGroupRequest req, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == competitionId);
            if (!compExists) return Results.NotFound(new { error = "Competition not found." });
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { error = "Name is required." });

            var duplicate = await db.Groups.AnyAsync(g => g.CompetitionId == competitionId && g.Name == req.Name);
            if (duplicate) return Results.Conflict(new { error = "A group with this name already exists." });

            var g = new Group
            {
                CompetitionId = competitionId,
                Name = req.Name.Trim(),
                DisplayOrder = req.DisplayOrder,
            };
            db.Groups.Add(g);
            await db.SaveChangesAsync();
            return Results.Created($"/api/groups/{g.Id}", g.ToDto());
        }).RequireAuthorization("Admin");

        app.MapPut("/groups/{id:int}", async (int id, UpdateGroupRequest req, BetonatorDbContext db) =>
        {
            var g = await db.Groups.FindAsync(id);
            if (g is null) return Results.NotFound();
            if (string.IsNullOrWhiteSpace(req.Name))
                return Results.BadRequest(new { error = "Name is required." });

            var duplicate = await db.Groups.AnyAsync(x =>
                x.CompetitionId == g.CompetitionId && x.Name == req.Name && x.Id != id);
            if (duplicate) return Results.Conflict(new { error = "A group with this name already exists." });

            g.Name = req.Name.Trim();
            g.DisplayOrder = req.DisplayOrder;
            await db.SaveChangesAsync();
            return Results.Ok(g.ToDto());
        }).RequireAuthorization("Admin");

        app.MapDelete("/groups/{id:int}", async (int id, BetonatorDbContext db) =>
        {
            var g = await db.Groups.FindAsync(id);
            if (g is null) return Results.NotFound();
            db.Groups.Remove(g);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("Admin");

        app.MapGet("/competitions/{competitionId:int}/group-standings", async (int competitionId, BetonatorDbContext db) =>
        {
            var compExists = await db.Competitions.AnyAsync(c => c.Id == competitionId);
            if (!compExists) return Results.NotFound();

            var groups = await db.Groups
                .Where(g => g.CompetitionId == competitionId)
                .OrderBy(g => g.DisplayOrder).ThenBy(g => g.Name)
                .ToListAsync();

            var matches = await db.Matches
                .Where(m => m.CompetitionId == competitionId && m.GroupId != null)
                .ToListAsync();

            var standings = groups.Select(g => new GroupStandingsDto(
                g.Id, g.Name,
                ComputeStandings(matches.Where(m => m.GroupId == g.Id))));

            return Results.Ok(standings);
        }).RequireAuthorization();

        return app;
    }

    private static IReadOnlyList<GroupStandingRowDto> ComputeStandings(IEnumerable<Match> matches)
    {
        var rows = new Dictionary<string, GroupStandingRowDto>(StringComparer.OrdinalIgnoreCase);

        GroupStandingRowDto Get(string team) =>
            rows.TryGetValue(team, out var row) ? row : new GroupStandingRowDto(team, 0, 0, 0, 0, 0, 0, 0, 0);

        foreach (var m in matches.Where(x => x.HasResult))
        {
            var g1 = m.Goal1!.Value;
            var g2 = m.Goal2!.Value;

            var r1 = Get(m.Team1);
            var r2 = Get(m.Team2);

            int w1 = 0, d1 = 0, l1 = 0, w2 = 0, d2 = 0, l2 = 0, p1 = 0, p2 = 0;
            if (g1 > g2) { w1 = 1; l2 = 1; p1 = 3; }
            else if (g1 < g2) { l1 = 1; w2 = 1; p2 = 3; }
            else { d1 = d2 = 1; p1 = p2 = 1; }

            r1 = r1 with
            {
                Played = r1.Played + 1,
                Won = r1.Won + w1,
                Drawn = r1.Drawn + d1,
                Lost = r1.Lost + l1,
                GoalsFor = r1.GoalsFor + g1,
                GoalsAgainst = r1.GoalsAgainst + g2,
                GoalDifference = r1.GoalDifference + (g1 - g2),
                Points = r1.Points + p1,
            };
            r2 = r2 with
            {
                Played = r2.Played + 1,
                Won = r2.Won + w2,
                Drawn = r2.Drawn + d2,
                Lost = r2.Lost + l2,
                GoalsFor = r2.GoalsFor + g2,
                GoalsAgainst = r2.GoalsAgainst + g1,
                GoalDifference = r2.GoalDifference + (g2 - g1),
                Points = r2.Points + p2,
            };
            rows[m.Team1] = r1;
            rows[m.Team2] = r2;
        }

        return rows.Values
            .OrderByDescending(r => r.Points)
            .ThenByDescending(r => r.GoalDifference)
            .ThenByDescending(r => r.GoalsFor)
            .ThenBy(r => r.Team)
            .ToList();
    }
}
