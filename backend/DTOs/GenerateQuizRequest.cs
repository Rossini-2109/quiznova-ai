namespace backend.DTOs;

public class GenerateQuizRequest
{
    public IFormFile? File { get; set; }

    public string Difficulty { get; set; } = "";

    public int QuestionCount { get; set; }

    public string QuestionType { get; set; } = "";
}