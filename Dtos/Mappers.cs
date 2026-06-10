using Betonator.Domain;

namespace Betonator.Dtos;

public static class Mappers
{
    public static UserDto ToDto(this User u) =>
        new(u.Id, u.Username, u.Email, u.IsAdmin, u.IsDisabled, u.CreatedAt);

    public static CompetitionDto ToDto(this Competition c, int matchCount, int participantCount) =>
        new(c.Id, c.Name, c.IsInternational, c.CreatedAt, matchCount, participantCount);

    public static MatchDto ToDto(this Match m, BetDto? myBet) =>
        new(m.Id, m.CompetitionId, DateTime.SpecifyKind(m.GameTime, DateTimeKind.Utc),
            m.Team1, m.Team2, m.Goal1, m.Goal2, m.Description, m.ResultDescription,
            m.IsLocked, m.GroupId, m.Stage, m.BracketPosition,
            m.FeederMatch1Id, m.FeederMatch2Id, myBet);

    public static GroupDto ToDto(this Group g) =>
        new(g.Id, g.CompetitionId, g.Name, g.DisplayOrder);

    public static BetDto ToDto(this Bet b, string username) =>
        new(b.Id, b.MatchId, b.UserId, username, b.BetGoal1, b.BetGoal2,
            DeriveOutcome(b.BetGoal1, b.BetGoal2), b.Points,
            DateTime.SpecifyKind(b.PlacedAt, DateTimeKind.Utc),
            DateTime.SpecifyKind(b.UpdatedAt, DateTimeKind.Utc));

    public static string DeriveOutcome(int goal1, int goal2) =>
        goal1 > goal2 ? "H" : goal1 < goal2 ? "A" : "D";
}
