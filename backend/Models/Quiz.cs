namespace backend.Models;

public class Quiz
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string QuizCode { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Easy";

    public int TimeLimit { get; set; }

    public string Status { get; set; } = "Draft";

    public Guid TeacherId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Question> Questions { get; set; }
        = new List<Question>();

    
}