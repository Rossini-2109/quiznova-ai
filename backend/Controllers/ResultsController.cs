using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResultsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ResultsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("quiz/{quizId}")]
    public async Task<IActionResult> GetQuizResults(Guid quizId, [FromQuery] Guid? sessionId = null)
    {
        var query = _context.QuizAttempts
            .Include(x => x.Student)
            .Where(x => x.QuizId == quizId);

        if (sessionId.HasValue)
        {
            if (sessionId.Value == Guid.Empty)
            {
                query = query.Where(x => x.SessionId == null);
            }
            else
            {
                query = query.Where(x => x.SessionId == sessionId.Value);
            }
        }

        var results = await query
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.TimeTakenMilliseconds)
            .Select(x => new
            {
                x.Id,
                x.StudentId,
                StudentName = x.Student != null ? x.Student.Name : "Unknown",
                x.Score,
                x.Percentage,
                x.CorrectAnswers,
                x.WrongAnswers,
                x.SkippedQuestions,
                x.TotalQuestions,
                x.Accuracy,
                x.TimeTakenMilliseconds,
                x.CompletionStatus,
                x.StartedAt,
                x.SubmittedAt,
                Answers = _context.QuizAnswers
                    .Where(a => a.AttemptId == x.Id)
                    .Join(_context.Questions,
                        ans => ans.QuestionId,
                        q => q.Id,
                        (ans, q) => new { ans, q })
                    .Select(joined => new
                    {
                        joined.ans.QuestionId,
                        QuestionIndex = joined.q.OrderIndex,
                        joined.ans.SelectedAnswer,
                        joined.ans.IsCorrect
                    })
                    .ToList()
            })
            .ToListAsync();

        return Ok(results);
    }

    [Authorize(Roles = "Teacher")]
    [HttpGet("quiz/{quizId}/sessions")]
    public async Task<IActionResult> GetQuizSessions(Guid quizId)
    {
        var sessions = await _context.Sessions
            .Where(s => s.QuizId == quizId)
            .OrderByDescending(s => s.StartedAt ?? s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.SessionCode,
                s.JoinLink,
                s.IsStarted,
                s.IsEnded,
                s.CreatedAt,
                s.StartedAt,
                s.EndedAt,
                ParticipantCount = _context.QuizAttempts.Count(a => a.SessionId == s.Id)
            })
            .ToListAsync();

        var practiceAttemptCount = await _context.QuizAttempts
            .CountAsync(a => a.QuizId == quizId && a.SessionId == null);

        return Ok(new { sessions, practiceAttemptCount });
    }
}