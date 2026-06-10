using Betonator.Domain;

namespace Betonator.Dtos;

public record MatchDto(
    int Id,
    int CompetitionId,
    DateTime GameTime,
    string Team1,
    string Team2,
    int? Goal1,
    int? Goal2,
    string? Description,
    string? ResultDescription,
    bool IsLocked,
    int? GroupId,
    MatchStage? Stage,
    int BracketPosition,
    int? FeederMatch1Id,
    int? FeederMatch2Id,
    BetDto? MyBet);

public record CreateMatchRequest(
    int CompetitionId,
    DateTime GameTime,
    string Team1,
    string Team2,
    string? Description,
    int? GroupId,
    MatchStage? Stage,
    int BracketPosition,
    int? FeederMatch1Id,
    int? FeederMatch2Id);

public record UpdateMatchRequest(
    DateTime GameTime,
    string Team1,
    string Team2,
    string? Description,
    int? GroupId,
    MatchStage? Stage,
    int BracketPosition,
    int? FeederMatch1Id,
    int? FeederMatch2Id);

public record SetResultRequest(int Goal1, int Goal2, string? ResultDescription);
