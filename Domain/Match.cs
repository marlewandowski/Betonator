namespace Betonator.Domain;

public class Match
{
    public int Id { get; set; }
    public int CompetitionId { get; set; }
    public DateTime GameTime { get; set; }
    public string Team1 { get; set; } = null!;
    public string Team2 { get; set; } = null!;
    public int? Goal1 { get; set; }
    public int? Goal2 { get; set; }
    public string? Description { get; set; }
    public string? ResultDescription { get; set; }

    public int? GroupId { get; set; }
    public MatchStage? Stage { get; set; }
    public int BracketPosition { get; set; }
    public int? FeederMatch1Id { get; set; }
    public int? FeederMatch2Id { get; set; }

    public Competition Competition { get; set; } = null!;
    public Group? Group { get; set; }
    public Match? FeederMatch1 { get; set; }
    public Match? FeederMatch2 { get; set; }
    public ICollection<Bet> Bets { get; set; } = new List<Bet>();

    public bool HasResult => Goal1.HasValue && Goal2.HasValue;
    public bool IsLocked => GameTime <= DateTime.UtcNow;
}
