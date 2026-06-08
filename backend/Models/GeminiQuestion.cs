namespace backend.AI.Models;

public class GeminiQuestion
{
    public string Question { get; set; } = string.Empty;

    public List<string> Options { get; set; } = new();

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;
}