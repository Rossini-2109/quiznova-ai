using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class QuizAttempt
{
    public Guid Id { get; set; }

    public Guid? SessionId { get; set; }

    public Session? Session { get; set; }

    public Guid QuizId { get; set; }

    public Quiz? Quiz { get; set; }

    public Guid StudentId { get; set; }

    public User? Student { get; set; }

    public string EmployeeId { get; set; } = string.Empty;

    public int Score { get; set; }

    public int TotalQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public int WrongAnswers { get; set; }

    // Existing field used by controllers
    public int SkippedQuestions { get; set; }

    // Alias for newer code
    [NotMapped]
    public int Unanswered
    {
        get => SkippedQuestions;
        set => SkippedQuestions = value;
    }

    public double Percentage { get; set; }

    public double Accuracy { get; set; }

    /// <summary>
    /// Pass mark set by teacher (percentage). 0 = not set.
    /// </summary>
    public double PassMark { get; set; } = 0;

    /// <summary>
    /// Completion status: Completed, Incomplete
    /// </summary>
    public string CompletionStatus { get; set; } = "Completed";

    // Stored in milliseconds
    public int TimeTakenMilliseconds { get; set; }

    // Optional seconds field
    public int TimeTakenSeconds { get; set; }

    [NotMapped]
    public int TimeTaken => TimeTakenMilliseconds / 1000;

    public bool Completed { get; set; }

    public int Rank { get; set; }

    public DateTime StartedAt { get; set; }

    public DateTime SubmittedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}