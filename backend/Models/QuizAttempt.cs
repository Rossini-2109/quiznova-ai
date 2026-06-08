using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class QuizAttempt
{
    public Guid Id { get; set; }

    public Guid StudentId { get; set; }

    public User? Student { get; set; }

    public Guid QuizId { get; set; }

    public Quiz? Quiz { get; set; }

    public int Score { get; set; }

    public int TotalQuestions { get; set; }

    public int CorrectAnswers { get; set; }

    public double Percentage { get; set; }

    public int TimeTakenMilliseconds { get; set; }
    // Computed total time in seconds (read‑only)
    [NotMapped]
    public int TimeTaken => TimeTakenMilliseconds / 1000;

    public DateTime StartedAt { get; set; }

    public DateTime SubmittedAt { get; set; }
}