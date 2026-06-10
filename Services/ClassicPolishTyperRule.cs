namespace Betonator.Services;

public class ClassicPolishTyperRule : IScoringRule
{
    public int Score(int matchGoal1, int matchGoal2, int betGoal1, int betGoal2)
    {
        bool actualDraw = matchGoal1 == matchGoal2;
        bool predictedDraw = betGoal1 == betGoal2;

        bool correctResult =
            (actualDraw && predictedDraw) ||
            (matchGoal1 > matchGoal2 && betGoal1 > betGoal2) ||
            (matchGoal1 < matchGoal2 && betGoal1 < betGoal2);

        if (!correctResult)
            return 0;

        int score = 3;

        if (matchGoal1 == betGoal1)
            score++;

        if (matchGoal2 == betGoal2)
            score++;

        return score;
    }
}
