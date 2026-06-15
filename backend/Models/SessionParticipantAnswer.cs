namespace backend.Models;

public class SessionParticipantAnswer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }

    public Guid SessionParticipantId { get; set; }
    public SessionParticipant? Participant { get; set; }

    public Guid QuestionId { get; set; }
    public Question? Question { get; set; }

    public string SelectedOption { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }
    
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;

    
}
