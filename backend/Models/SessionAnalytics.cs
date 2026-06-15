namespace backend.Models;

public class SessionAnalytics
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }

    public int TotalQuestions { get; set; } = 0;
    public int CorrectCount { get; set; } = 0;
    public int WrongCount { get; set; } = 0;
    public int SkippedCount { get; set; } = 0;
    
    public double AverageResponseTimeMs { get; set; } = 0;
    
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
