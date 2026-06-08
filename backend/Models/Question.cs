using System.Text.Json.Serialization;

namespace backend.Models;

public class Question
{
    public Guid Id { get; set; }

    public Guid QuizId { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;

    public string QuestionType { get; set; } = "MCQ";

    public int OrderIndex { get; set; } = 0;

    [JsonIgnore]
    public Quiz? Quiz { get; set; }
}