namespace Betonator.Domain;

public class Competition
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public bool IsInternational { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Match> Matches { get; set; } = new List<Match>();
    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<CompetitionParticipant> Participants { get; set; } = new List<CompetitionParticipant>();
}
