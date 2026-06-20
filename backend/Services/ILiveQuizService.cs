using backend.DTOs;
using backend.Models;

namespace backend.Services;

public interface ILiveQuizService
{
    Task<Session> GetSessionAsync(string sessionCode);
    Task<Session> CreateSessionAsync(Guid quizId, Guid teacherId);
    Task StartSessionAsync(string sessionCode);
    Task InitializeShufflingAsync(string sessionId);
    Task PauseSessionAsync(string sessionCode);
    Task ResumeSessionAsync(string sessionCode);
    Task NextQuestionAsync(string sessionCode);
    Task PreviousQuestionAsync(string sessionCode);
    Task JumpToQuestionAsync(string sessionCode, int questionIndex);
    Task EndSessionAsync(string sessionCode);
    
    Task AddParticipantAsync(string sessionCode, string connectionId, string name, string employeeId);
    Task RemoveParticipantAsync(string sessionCode, string studentName);
    Task<List<LiveParticipantDto>> GetParticipantsAsync(string sessionCode);
    
    Task SubmitAnswerAsync(string sessionCode, string studentName, Guid questionId, string selectedOption, int timeTakenMs);
    Task<LiveQuestionAnalyticsDto> GetQuestionAnalyticsAsync(string sessionCode, Guid questionId);
    Task<bool> EndSessionAndPersistResultsAsync(string sessionCode);
    
    Task ReportSuspiciousActivityAsync(string sessionCode, string studentName, string activityType);
    Task UpdateCurrentQuestionAsync(string sessionCode, string studentName, int questionIndex);
    Task<LiveSession?> GetSessionAsync(string code);
     Task ExpireSessionAsync(string sessionCode);
}
