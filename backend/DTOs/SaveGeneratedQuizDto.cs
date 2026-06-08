namespace backend.DTOs;

public class SaveGeneratedQuizDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Medium";

    public int TimeLimit { get; set; }

    public Guid TeacherId { get; set; }

    public List<GeneratedQuestionDto> Questions { get; set; } = [];
}