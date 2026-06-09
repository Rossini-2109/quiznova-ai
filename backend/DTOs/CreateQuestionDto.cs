namespace backend.DTOs;

public class CreateQuestionDto
{
    public Guid QuizId { get; set; }

    public string QuestionText { get; set; } = string.Empty;

    public string OptionA { get; set; } = string.Empty;

    public string OptionB { get; set; } = string.Empty;

    public string OptionC { get; set; } = string.Empty;

    public string OptionD { get; set; } = string.Empty;

    public string CorrectAnswer { get; set; } = string.Empty;

    public string Explanation { get; set; } = string.Empty;
    public int QuestionTimeLimit { get; set; } = 30;

    public string QuestionType { get; set; } = "MCQ";
}