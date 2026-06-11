using Microsoft.AspNetCore.SignalR;
using backend.Services;

namespace backend.Hubs;

public class QuizHub : Hub
{
    private readonly ILobbyService _lobbyService;

    public QuizHub(ILobbyService lobbyService)
    {
        _lobbyService = lobbyService;
    }

    // Called by a student to join a session and register their name
    public async Task JoinSession(string sessionCode, string studentName)
    {
        // Register participant
        _lobbyService.AddParticipant(sessionCode, Context.ConnectionId, studentName);
        // Add connection to the SignalR group
        await Groups.AddToGroupAsync(Context.ConnectionId, sessionCode);
        // Optionally broadcast current participant list
        var participants = _lobbyService.GetParticipantNames(sessionCode);
        await Clients.Group(sessionCode).SendAsync("ParticipantListUpdated", participants);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Remove participant from any session they belong to
        var allSessions = _lobbyService.GetAllSessionCodes();
        foreach (var session in allSessions)
        {
            _lobbyService.RemoveParticipant(session, Context.ConnectionId);
        }
        await base.OnDisconnectedAsync(exception);
    }

    // Notify others that a student has joined (can be called separately if needed)
    public async Task StudentJoined(string sessionCode, string studentName)
    {
        // Ensure participant is registered (idempotent)
        _lobbyService.AddParticipant(sessionCode, Context.ConnectionId, studentName);
        await Clients.Group(sessionCode).SendAsync("StudentJoined", studentName);
    }

    // Teacher triggers start of quiz
    public async Task StartQuiz(string sessionCode)
    {
        await Clients.Group(sessionCode).SendAsync("QuizStarted");
    }
}