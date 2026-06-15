using System;

namespace backend.Models;

public class StudentAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public Guid QuestionId { get; set; }
    public Question? Question { get; set; }
    public string SelectedOption { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int TimeTaken { get; set; }
    public int ScoreEarned { get; set; }
    public Guid SessionId { get; set; }
}
