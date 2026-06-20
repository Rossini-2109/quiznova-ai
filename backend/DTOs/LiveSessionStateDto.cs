namespace backend.DTOs;

public class LiveSessionStateDto
{
    public string SessionCode { get; set; } = string.Empty;
    public Guid QuizId { get; set; }
    public string Title { get; set; } = string.Empty;
    public bool IsStarted { get; set; }
    public bool IsPaused { get; set; }
    public bool IsEnded { get; set; }
    public int CurrentQuestionIndex { get; set; }
    public int TotalQuestions { get; set; }
}

public class LiveParticipantDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmployeeId { get; set; } = string.Empty;
    public bool IsConnected { get; set; }
    public int Score { get; set; }
    public int CorrectAnswers { get; set; }
    public int WrongAnswers { get; set; }
    public int SkippedAnswers { get; set; }
    public double AverageTimeTakenMs { get; set; }
    public int SuspicionScore { get; set; }
    public int Rank { get; set; }
    public int CurrentQuestionIndex { get; set; } = 0;
}

public class LiveQuestionAnalyticsDto
{
    public Guid QuestionId { get; set; }
    public int QuestionIndex { get; set; }
    public int CorrectCount { get; set; }
    public int WrongCount { get; set; }
    public int SkippedCount { get; set; }
    public int OptionACount { get; set; }
    public int OptionBCount { get; set; }
    public int OptionCCount { get; set; }
    public int OptionDCount { get; set; }
    public int OptionECount { get; set; }
}
