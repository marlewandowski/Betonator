namespace Betonator.Domain;

public class Group
{
    public int Id { get; set; }
    public int CompetitionId { get; set; }
    public string Name { get; set; } = null!;
    public int DisplayOrder { get; set; }

    public Competition Competition { get; set; } = null!;
    public ICollection<Match> Matches { get; set; } = new List<Match>();
}
