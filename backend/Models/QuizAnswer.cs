namespace backend.Models;

public class QuizAnswer
{
    public Guid Id { get; set; }

    public Guid AttemptId { get; set; }

    public Guid QuestionId { get; set; }

    public string SelectedAnswer { get; set; } = string.Empty;

    public bool IsCorrect { get; set; }

    /// <summary>Time in milliseconds the student took to answer this question</summary>
    public int ResponseTimeMs { get; set; } = 0;
}