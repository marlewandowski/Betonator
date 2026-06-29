namespace Betonator.Dtos;

public record StandingsRowDto(
    int UserId,
    string Username,
    int Points,
    int PointsPlayoff,
    int BetsPlaced,
    int ExactScores,
    int CorrectOutcomes,
    int CorrectGoalsOneSide);
