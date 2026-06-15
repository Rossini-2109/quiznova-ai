using System;

namespace backend.Models;

public class QuizResult
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public Guid QuizId { get; set; }
    public Quiz? Quiz { get; set; }
    public int Score { get; set; }
    public int CorrectCount { get; set; }
    public int IncorrectCount { get; set; }
    public double AverageTime { get; set; }
    public int Rank { get; set; }
    public DateTime CompletedAt { get; set; } = DateTime.UtcNow;
}
