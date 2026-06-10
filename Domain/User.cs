namespace Betonator.Domain;

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = null!;
    public string PasswordHash { get; set; } = null!;
    public string? Email { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsDisabled { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<CompetitionParticipant> Participations { get; set; } = new List<CompetitionParticipant>();
    public ICollection<Bet> Bets { get; set; } = new List<Bet>();
}
