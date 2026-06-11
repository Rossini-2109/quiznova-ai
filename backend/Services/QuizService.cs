using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class QuizService : IQuizService
{
    private readonly ApplicationDbContext _context;

    public QuizService(
        ApplicationDbContext context
    )
    {
        _context = context;
    }

    public async Task<object>
        JoinSession(
            JoinSessionDto dto
        )
    {
        var session =
            await _context.Sessions
                .Include(x => x.Quiz)
                .FirstOrDefaultAsync(
                    x =>
                        x.SessionCode ==
                        dto.SessionCode
                );

        if (session == null)
        {
            throw new Exception(
                "Session not found"
            );
        }

        return new
        {
            session.Id,
            session.Quiz.Title
        };
    }

    public async Task<bool>
        StartSession(
            Guid sessionId
        )
    {
        var session =
            await _context.Sessions
                .FirstOrDefaultAsync(
                    x => x.Id == sessionId
                );

        if (session == null)
        {
            return false;
        }

        session.IsStarted = true;

        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<object>
        GetLeaderboard(
            Guid sessionId
        )
    {
        var leaderboard =
            await _context.QuizAttempts
                .Where(
                    x =>
                        x.SessionId ==
                        sessionId
                )
                .OrderByDescending(
                    x => x.Score
                )
                .ThenBy(
                    x =>
                        x.TimeTakenSeconds
                )
                .Select(
                    x =>
                        new
                        {
                            x.Student.Name,
                            x.Score,
                            x.Rank
                        }
                )
                .ToListAsync();

        return leaderboard;
    }
}