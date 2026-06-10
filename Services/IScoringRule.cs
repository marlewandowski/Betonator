namespace Betonator.Services;

public interface IScoringRule
{
    int Score(int matchGoal1, int matchGoal2, int betGoal1, int betGoal2);
}
