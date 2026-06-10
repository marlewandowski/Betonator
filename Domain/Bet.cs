namespace Betonator.Domain;

public class Bet
{
    public int Id { get; set; }
    public int MatchId { get; set; }
    public int UserId { get; set; }
    public int BetGoal1 { get; set; }
    public int BetGoal2 { get; set; }
    public int? Points { get; set; }
    public DateTime PlacedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public Match Match { get; set; } = null!;
    public User User { get; set; } = null!;
}
