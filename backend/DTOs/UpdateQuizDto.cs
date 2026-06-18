namespace backend.DTOs;

public class UpdateQuizDto
{
    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; } = string.Empty; // optional

    public string Difficulty { get; set; } = string.Empty;

    public int TimeLimit { get; set; }

    public System.Guid? FolderId { get; set; }

    public string? Tags { get; set; }

    public string? Instructions { get; set; }

    public int? DefaultQuestionTimeSeconds { get; set; }

    public System.Collections.Generic.List<QuestionUpdateDto>? Questions { get; set; }
}

public class QuestionUpdateDto
{
    public System.Guid? Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public string OptionE { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;
    public int QuestionTimeLimit { get; set; } = 10;
    public string? QuestionImageUrl { get; set; }
    public string? OptionAImageUrl { get; set; }
    public string? OptionBImageUrl { get; set; }
    public string? OptionCImageUrl { get; set; }
    public string? OptionDImageUrl { get; set; }
    public string? OptionEImageUrl { get; set; }
}