namespace Betonator.Dtos;

public record CompetitionDto(
    int Id,
    string Name,
    bool IsInternational,
    DateTime CreatedAt,
    int MatchCount,
    int ParticipantCount);

public record CreateCompetitionRequest(string Name, bool IsInternational);

public record UpdateCompetitionRequest(string Name, bool IsInternational);

public record ParticipantDto(int UserId, string Username, bool IsActive);

public record AddParticipantRequest(int UserId, bool IsActive);
