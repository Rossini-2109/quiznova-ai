using Microsoft.AspNetCore.SignalR;
using backend.Services;
using backend.DTOs;
using backend.Models;

namespace backend.Hubs;

public class QuizHub : Hub
{
    private readonly ILiveQuizService _liveQuizService;

    public QuizHub(ILiveQuizService liveQuizService)
    {
        _liveQuizService = liveQuizService;
    }

    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, (string SessionCode, string StudentName)> _connections = new();

    // Student Actions
    public async Task<SubmitAnswerResult> SubmitAnswer(string sessionCode, string studentName, Guid questionId, string selectedOption, int timeTakenMs)
    {
        var result = await _liveQuizService.SubmitAnswerAsync(sessionCode, studentName, questionId, selectedOption, timeTakenMs);
        
        // Notify teacher of updated analytics and leaderboard
        var analytics = await _liveQuizService.GetQuestionAnalyticsAsync(sessionCode, questionId);
        var leaderboard = await _liveQuizService.GetParticipantsAsync(sessionCode);
        
        await Clients.Group(sessionCode).SendAsync("AnalyticsUpdated", analytics);
        await Clients.Group(sessionCode).SendAsync("LeaderboardUpdated", leaderboard);
        await Clients.Group(sessionCode).SendAsync("AnswerSubmitted", studentName);

        return result;
    }

    public async Task<bool> JoinSession(
        string sessionCode,
        string studentName,
        string employeeId = "")
    {
        try
        {
            Console.WriteLine($"JOIN => Session:{sessionCode} | Student:{studentName} | EmpId:{employeeId}");
            // Try to get the session; if not found, GetSessionAsync throws – catch it.
            backend.Models.Session session = null;
            try
            {
                session = await _liveQuizService.GetSessionAsync(sessionCode);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[JOIN] Session lookup failed: {ex.Message}");
                return false;
            }
            if (session == null)
            {
                Console.WriteLine($"[JOIN] Session '{sessionCode}' does not exist.");
                return false;
            }
            await _liveQuizService.AddParticipantAsync(
                sessionCode,
                Context.ConnectionId,
                studentName,
                employeeId);

            if (studentName != "Teacher")
            {
                _connections[Context.ConnectionId] = (sessionCode, studentName);
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, sessionCode);
            var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
            await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
            await Clients.Group(sessionCode).SendAsync("ParticipantJoined", studentName);
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine("[JOIN] Unexpected error:");
            Console.WriteLine(ex);
            return false;
        }
    }

    // Teacher Actions
    public async Task TeacherStartedQuiz(string sessionCode)
    {
        await _liveQuizService.StartSessionAsync(sessionCode);
        // Initialize shuffling after session start if needed
        await _liveQuizService.InitializeShufflingAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("QuizStarted");
    }

    public async Task TeacherPausedQuiz(string sessionCode)
    {
        await _liveQuizService.PauseSessionAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("QuizPaused");
    }

    public async Task TeacherResumedQuiz(string sessionCode)
    {
        await _liveQuizService.ResumeSessionAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("QuizResumed");
    }

    public async Task TeacherMovedToQuestion(string sessionCode, int direction)
    {
        if (direction > 0)
        {
            await _liveQuizService.NextQuestionAsync(sessionCode);
        }
        else
        {
            await _liveQuizService.PreviousQuestionAsync(sessionCode);
        }
        await Clients.Group(sessionCode).SendAsync("QuestionChanged", direction);
    }

    public async Task TeacherJumpedToQuestion(string sessionCode, int questionIndex)
    {
        await _liveQuizService.JumpToQuestionAsync(sessionCode, questionIndex);
        await Clients.Group(sessionCode).SendAsync("QuestionJumped", questionIndex);
    }

    // Teacher ends quiz – persist results and expire session
    public async Task TeacherEndedQuiz(string sessionCode)
    {
        await _liveQuizService.EndSessionAndPersistResultsAsync(sessionCode);
        // Mark session as expired so future joins fail
        await _liveQuizService.ExpireSessionAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("QuizEnded");
    }

    // New method: Teacher removes a participant (student)
    public async Task TeacherRemoveStudent(string sessionCode, string participantId)
    {
        await _liveQuizService.RemoveParticipantAsync(sessionCode, participantId);
        var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("ParticipantRemoved", participantId);
        await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
    }

    public async Task ChangeTheme(string sessionCode, string themeName)
    {
        await Clients.Group(sessionCode).SendAsync("ThemeChanged", themeName);
    }

    // Anti-Cheat Reporting
    public async Task ReportSuspiciousActivity(string sessionCode, string studentName, string activityType)
    {
        await _liveQuizService.ReportSuspiciousActivityAsync(sessionCode, studentName, activityType);
        
        var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
        await Clients.Group(sessionCode).SendAsync("LeaderboardUpdated", participants);
    }

    // Current Question Tracking
    public async Task UpdateCurrentQuestion(string sessionCode, string studentName, int questionIndex)
    {
        await _liveQuizService.UpdateCurrentQuestionAsync(sessionCode, studentName, questionIndex);
        
        var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
    }

    public async Task KickStudent(string sessionCode, string studentName)
    {
        await _liveQuizService.KickParticipantAsync(sessionCode, studentName);
        var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
        await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
        await Clients.Group(sessionCode).SendAsync("StudentKicked", studentName);
    }

    // Connection tracking
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryRemove(Context.ConnectionId, out var info))
        {
            await _liveQuizService.RemoveParticipantAsync(info.SessionCode, info.StudentName);
            
            var participants = await _liveQuizService.GetParticipantsAsync(info.SessionCode);
            await Clients.Group(info.SessionCode).SendAsync("ParticipantListUpdated", participants);
            await Clients.Group(info.SessionCode).SendAsync("ParticipantLeft", info.StudentName);
        }
        await base.OnDisconnectedAsync(exception);
    }
}