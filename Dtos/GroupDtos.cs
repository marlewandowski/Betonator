namespace Betonator.Dtos;

public record GroupDto(int Id, int CompetitionId, string Name, int DisplayOrder);

public record CreateGroupRequest(string Name, int DisplayOrder);

public record UpdateGroupRequest(string Name, int DisplayOrder);

public record GroupStandingRowDto(
    string Team,
    int Played,
    int Won,
    int Drawn,
    int Lost,
    int GoalsFor,
    int GoalsAgainst,
    int GoalDifference,
    int Points);

public record GroupStandingsDto(int GroupId, string Name, IReadOnlyList<GroupStandingRowDto> Rows);
