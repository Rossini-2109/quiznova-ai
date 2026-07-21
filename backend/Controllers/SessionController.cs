using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace backend.Controllers;

[ApiController]
[Route("api/session")]
public class SessionController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SessionController(
        ApplicationDbContext context
    )
    {
        _context = context;
    }

    [HttpPost("create")]
    public async Task<IActionResult>
        CreateSession(
            CreateSessionDto dto
        )
    {
        var quiz =
            await _context.Quizzes.FindAsync(
                dto.QuizId
            );

        if (quiz == null)
        {
            return NotFound();
        }

        var code =
            Random.Shared.Next(
                100000,
                999999
            ).ToString();

        var rawFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
            ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_FRONTEND_URL");
        var frontendUrl = (string.IsNullOrWhiteSpace(rawFrontendUrl) || rawFrontendUrl.Contains("onrender.com"))
            ? "https://quiznova-ai-eta.vercel.app"
            : rawFrontendUrl.TrimEnd('/');

        var joinLink = $"{frontendUrl}/join/{code}";

        var qrCodeUrl =
            $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={joinLink}";

        var session =
            new Session
            {
                Id = Guid.NewGuid(),
                QuizId = quiz.Id,
                SessionCode = code,
                JoinLink = joinLink,
                QrCodeUrl = qrCodeUrl,
                IsStarted = false,
                IsEnded = false
            };

        _context.Sessions.Add(
            session
        );

        await _context.SaveChangesAsync();

        return Ok(session);
    }
    [HttpPost("join")]
public async Task<IActionResult> JoinSession(
    JoinSessionDto dto
)
{
    var session =
        await _context.Sessions
            .FirstOrDefaultAsync(
                x =>
                    x.SessionCode ==
                    dto.SessionCode
            );

    if (session == null)
    {
        return BadRequest(
            "Invalid Session Code"
        );
    }

    var exists =
        await _context.SessionParticipants
            .AnyAsync(
                x =>
                    x.SessionId ==
                        session.Id &&
                    x.EmployeeId ==
                        dto.EmployeeId
            );

    if (exists)
    {
        return BadRequest(
            "Already Joined"
        );
    }

    var participant =
        new SessionParticipant
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            StudentName =
                dto.StudentName,
            EmployeeId =
                dto.EmployeeId,
            IsConnected = true
        };

    _context.SessionParticipants.Add(
        participant
    );

    await _context.SaveChangesAsync();

    return Ok(
        new
        {
            session.Id,
            participant.StudentName
        }
    );
}
}