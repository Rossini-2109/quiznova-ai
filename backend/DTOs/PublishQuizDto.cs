namespace backend.DTOs;

public class PublishQuizDto
{
    public int MaxAttempts { get; set; } = 1;
    public bool ShuffleQuestions { get; set; } = false;
}
