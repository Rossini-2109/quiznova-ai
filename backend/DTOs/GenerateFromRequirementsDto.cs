namespace backend.DTOs;

public class GenerateFromRequirementsDto
{
    // Teacher's description of the quiz to generate (topic, focus, constraints).
    public string Requirements { get; set; } = "";

    public int QuestionCount { get; set; } = 5;

    public string Difficulty { get; set; } = "Medium";
}
