namespace backend.Models;

public class Quiz
{
    public Guid Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string QuizCode { get; set; } = string.Empty;

    public string Difficulty { get; set; } = "Easy";

    public int TimeLimit { get; set; }
    // Default seconds allotted per question; teacher can customise per quiz
    public int DefaultQuestionTimeSeconds { get; set; } = 5;
    // Token used for public shareable link
    public string? ShareToken { get; set; }

    public string Status { get; set; } = "Draft";

    public Guid TeacherId { get; set; }

    public Guid? FolderId { get; set; }
    public Folder? Folder { get; set; }

    public bool IsAiGenerated { get; set; } = false;

    public string Tags { get; set; } = string.Empty;

    public string Instructions { get; set; } = string.Empty;

    public int NumberOfQuestions { get; set; }

    public int MaxAttempts { get; set; } = 1;

    public bool ShuffleQuestions { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Question> Questions { get; set; }
        = new List<Question>();
    // Navigation to attempts for ranking
    public ICollection<QuizAttempt> Attempts { get; set; } = new List<QuizAttempt>();
    public ICollection<StudentEnrollment> StudentEnrollments { get; set; } = new List<StudentEnrollment>();
}