namespace backend.Models;

public class QuizResponse
{
    public Guid Id { get; set; }

    public Guid AttemptId { get; set; }

    public QuizAttempt? Attempt { get; set; }

    public Guid QuestionId { get; set; }

    public Question? Question { get; set; }

    public string SelectedAnswer { get; set; }
        = string.Empty;

    public bool IsCorrect { get; set; }

    public int TimeTakenSeconds { get; set; }
}