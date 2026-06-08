namespace backend.DTOs;

public class UpdateQuizDto
{
    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string Difficulty { get; set; } = string.Empty;

    public int TimeLimit { get; set; }

    public System.Guid? FolderId { get; set; }

    public string? Tags { get; set; }

    public string? Instructions { get; set; }

    public int? DefaultQuestionTimeSeconds { get; set; }
}