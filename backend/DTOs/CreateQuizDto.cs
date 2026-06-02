namespace backend.DTOs;

public class CreateQuizDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Easy";

    public int TimeLimit { get; set; }
}