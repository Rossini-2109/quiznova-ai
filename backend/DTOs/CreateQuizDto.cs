namespace backend.DTOs;

public class CreateQuizDto
{
    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public string Difficulty { get; set; } = "";

    public int TimeLimit { get; set; }

    public System.Guid? FolderId { get; set; }

    public string? Tags { get; set; }

    public string? Instructions { get; set; }
}