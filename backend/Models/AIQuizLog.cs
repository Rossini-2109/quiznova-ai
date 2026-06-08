namespace backend.Models;

public class AIQuizLog
{
    public Guid Id { get; set; }

    public Guid TeacherId { get; set; }

    public int PromptTokens { get; set; }

    public int GeneratedQuestions { get; set; }

    public string FileName { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; }
}