using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace backend.Hubs;

public class QuizHub : Hub
{
    // Join a quiz-specific group for real-time alerts
    public async Task JoinQuizGroup(string quizCode, string userName, bool isTeacher)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, quizCode);
        
        if (!isTeacher)
        {
            // Notify group that student joined
            await Clients.Group(quizCode).SendAsync("StudentJoined", new {
                Name = userName,
                ConnectionId = Context.ConnectionId
            });
        }
    }

    // Leave a group when disconnecting
    public async Task LeaveQuizGroup(string quizCode)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, quizCode);
    }

    // Student started the quiz
    public async Task StudentStart(string quizCode, string userName)
    {
        await Clients.Group(quizCode).SendAsync("StudentStarted", new {
            Name = userName
        });
    }

    // Student moved to a new question
    public async Task StudentProgress(string quizCode, string userName, int questionNumber)
    {
        await Clients.Group(quizCode).SendAsync("StudentProgressUpdate", new {
            Name = userName,
            QuestionNumber = questionNumber
        });
    }

    // Student submitted the quiz
    public async Task StudentSubmit(string quizCode, string userName, int score, int correct, int total)
    {
        await Clients.Group(quizCode).SendAsync("StudentSubmitted", new {
            Name = userName,
            Score = score,
            Correct = correct,
            Total = total
        });
    }
}
