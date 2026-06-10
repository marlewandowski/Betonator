namespace Betonator.Dtos;

public record StandingsRowDto(
    int UserId,
    string Username,
    int Points,
    int BetsPlaced,
    int ExactScores,
    int CorrectOutcomes);
