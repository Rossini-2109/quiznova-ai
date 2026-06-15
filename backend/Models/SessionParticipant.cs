namespace backend.Models;

public class SessionParticipant
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public Session? Session { get; set; }

    public string StudentName { get; set; }
        = string.Empty;

    public string EmployeeId { get; set; }
        = string.Empty;

    public bool IsConnected { get; set; }

    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    // Leaderboard/Analytics
    public int Score { get; set; } = 0;
    public int CorrectAnswers { get; set; } = 0;
    public int WrongAnswers { get; set; } = 0;
    public int SkippedAnswers { get; set; } = 0;
    public double AverageTimeTakenMs { get; set; } = 0;

    // Anti-Cheat Metrics
    public int TabSwitchCount { get; set; } = 0;
    public int FullscreenExitCount { get; set; } = 0;
    public int WindowBlurCount { get; set; } = 0;
    public int CopyAttempts { get; set; } = 0;
    public int SuspicionScore { get; set; } = 0; // 0-100

    
}