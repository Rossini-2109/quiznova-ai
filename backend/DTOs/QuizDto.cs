namespace backend.DTOs;

public class QuizDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Difficulty { get; set; }
    public int TimeLimit { get; set; }
    public string SessionCode { get; set; } = string.Empty;
    public Guid SessionId { get; set; }
    public bool ShuffleQuestions { get; set; }
    public List<QuestionDto> Questions { get; set; } = new();
}

public class QuestionDto
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public string OptionE { get; set; } = string.Empty;
    public string QuestionType { get; set; } = string.Empty;
    public int QuestionTimeLimit { get; set; }
    public string? QuestionImageUrl { get; set; }
    public string? OptionAImageUrl { get; set; }
    public string? OptionBImageUrl { get; set; }
    public string? OptionCImageUrl { get; set; }
    public string? OptionDImageUrl { get; set; }
    public string? OptionEImageUrl { get; set; }
}
