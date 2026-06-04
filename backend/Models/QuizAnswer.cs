namespace backend.Models;

public class QuizAnswer
{
    public Guid Id { get; set; }

    public Guid AttemptId { get; set; }

    public Guid QuestionId { get; set; }

    public string SelectedAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }
}