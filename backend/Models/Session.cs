namespace backend.Models;

public class Session
{
    public Guid Id { get; set; }

    public string SessionCode { get; set; }
        = string.Empty;

    public string JoinLink { get; set; }
        = string.Empty;

    public string QrCodeUrl { get; set; }
        = string.Empty;

    public Guid QuizId { get; set; }

    public Quiz? Quiz { get; set; }

    public bool IsStarted { get; set; }

    public bool IsEnded { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public int CurrentQuestionIndex { get; set; } = 0;
    
    public bool IsPaused { get; set; }

    
}