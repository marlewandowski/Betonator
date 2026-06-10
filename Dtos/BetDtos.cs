namespace Betonator.Dtos;

public record BetDto(
    int Id,
    int MatchId,
    int UserId,
    string Username,
    int BetGoal1,
    int BetGoal2,
    string Outcome,
    int? Points,
    DateTime PlacedAt,
    DateTime UpdatedAt);

public record UpsertBetRequest(int Goal1, int Goal2);
