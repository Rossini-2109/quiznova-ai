namespace backend.DTOs;

public class SubmitQuizDto
{
    public Guid AttemptId { get; set; }

    public Dictionary<string, string> Answers { get; set; }
        = new();
}