namespace Betonator.Domain;

public class CompetitionParticipant
{
    public int UserId { get; set; }
    public int CompetitionId { get; set; }
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public Competition Competition { get; set; } = null!;
}
