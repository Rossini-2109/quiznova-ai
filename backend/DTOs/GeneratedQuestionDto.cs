namespace backend.DTOs;

public class GeneratedQuestionDto
{
    public string Question { get; set; } = string.Empty;

    public List<string> Options { get; set; } = [];

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;
}