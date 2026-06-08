namespace backend.DTOs;

public class GenerateQuizDto
{
    public Guid TeacherId { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string Content { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Medium";

    public int QuestionCount { get; set; }

    public string QuestionType { get; set; } = "MCQ";
}