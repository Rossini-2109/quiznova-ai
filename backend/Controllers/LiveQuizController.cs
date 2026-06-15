using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs;
using System.Security.Claims;
using backend.Data;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LiveQuizController : ControllerBase
{
    private readonly ILiveQuizService _liveQuizService;
    private readonly ApplicationDbContext _context;
    private readonly IQRCodeService _qrCodeService;

    public LiveQuizController(ILiveQuizService liveQuizService, ApplicationDbContext context, IQRCodeService qrCodeService)
    {
        _liveQuizService = liveQuizService;
        _context = context;
        _qrCodeService = qrCodeService;
    }

    [HttpGet("{sessionCode}/state")]
    public async Task<IActionResult> GetSessionState(string sessionCode)
    {
        try
        {
            var session = await _liveQuizService.GetSessionAsync(sessionCode);
            var dto = new LiveSessionStateDto
            {
                SessionCode = session.SessionCode,
                QuizId = session.QuizId,
                Title = session.Quiz?.Title ?? "Unknown Quiz",
                IsStarted = session.IsStarted,
                IsPaused = session.IsPaused,
                IsEnded = session.IsEnded,
                CurrentQuestionIndex = session.CurrentQuestionIndex,
                TotalQuestions = session.Quiz?.Questions.Count ?? 0
            };
            return Ok(dto);
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
    
    [HttpGet("{sessionCode}/quiz")]
    public async Task<IActionResult> GetQuizBySessionCode(string sessionCode)
    {
        try
        {
            var session = await _liveQuizService.GetSessionAsync(sessionCode);

            if (session?.Quiz == null)
            {
                return NotFound(new { message = "Quiz not found" });
            }

            return Ok(new QuizDto
            {
                Id = session.Quiz.Id,
                Title = session.Quiz.Title,
                Description = session.Quiz.Description,
                Difficulty = session.Quiz.Difficulty,
                TimeLimit = session.Quiz.TimeLimit,
                SessionCode = session.SessionCode,
                SessionId = session.Id,
                Questions = session.Quiz.Questions != null ? session.Quiz.Questions.Select(q => new QuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    QuestionType = q.QuestionType,
                    QuestionTimeLimit = q.QuestionTimeLimit,
                    QuestionImageUrl = q.QuestionImageUrl,
                    OptionAImageUrl = q.OptionAImageUrl,
                    OptionBImageUrl = q.OptionBImageUrl,
                    OptionCImageUrl = q.OptionCImageUrl,
                    OptionDImageUrl = q.OptionDImageUrl
                }).ToList() : new List<QuestionDto>()
            });
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpGet("by-id/{sessionId}")]
    public async Task<IActionResult> GetSessionStateById(Guid sessionId)
    {
        try
        {
            var session = await _context.Sessions
                .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                .FirstOrDefaultAsync(s => s.Id == sessionId);
                
            if (session == null)
            {
                return NotFound(new { message = "Session not found" });
            }
            
            var dto = new LiveSessionStateDto
            {
                SessionCode = session.SessionCode,
                QuizId = session.QuizId,
                Title = session.Quiz?.Title ?? "Unknown Quiz",
                IsStarted = session.IsStarted,
                IsPaused = session.IsPaused,
                IsEnded = session.IsEnded,
                CurrentQuestionIndex = session.CurrentQuestionIndex,
                TotalQuestions = session.Quiz?.Questions.Count ?? 0
            };
            return Ok(new { session = session, state = dto });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{sessionId}/results")]
    public async Task<IActionResult> GetSessionResults(Guid sessionId)
    {
        try
        {
            var results = await _context.QuizResults
                .Where(r => r.SessionId == sessionId)
                .OrderBy(r => r.Rank)
                .ToListAsync();
            return Ok(results);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{sessionCode}/question-analysis")]
    public async Task<IActionResult> GetSessionQuestionAnalysis(string sessionCode)
    {
        try
        {
            var session = await _context.Sessions
                .Include(s => s.Quiz)
                .ThenInclude(q => q.Questions)
                .FirstOrDefaultAsync(s => s.SessionCode == sessionCode);

            if (session == null || session.Quiz == null)
            {
                return NotFound(new { message = "Session or Quiz not found" });
            }

            var studentAnswers = await _context.StudentAnswers
                .Where(a => a.SessionId == session.Id)
                .ToListAsync();

            var analysis = session.Quiz.Questions.Select(q =>
            {
                var questionAnswers = studentAnswers.Where(a => a.QuestionId == q.Id).ToList();
                int total = questionAnswers.Count;
                int correct = questionAnswers.Count(a => a.IsCorrect);
                double accuracy = total == 0 ? 0 : Math.Round(((double)correct / total) * 100);

                return new
                {
                    QuestionId = q.Id,
                    QuestionText = q.QuestionText,
                    CorrectAnswer = q.CorrectAnswer,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    Accuracy = accuracy,
                    CountA = questionAnswers.Count(a => string.Equals(a.SelectedOption, "A", StringComparison.OrdinalIgnoreCase)),
                    CountB = questionAnswers.Count(a => string.Equals(a.SelectedOption, "B", StringComparison.OrdinalIgnoreCase)),
                    CountC = questionAnswers.Count(a => string.Equals(a.SelectedOption, "C", StringComparison.OrdinalIgnoreCase)),
                    CountD = questionAnswers.Count(a => string.Equals(a.SelectedOption, "D", StringComparison.OrdinalIgnoreCase)),
                    CountEmpty = questionAnswers.Count(a => string.IsNullOrEmpty(a.SelectedOption))
                };
            }).ToList();

            return Ok(analysis);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{sessionCode}/participants")]
    public async Task<IActionResult> GetParticipants(string sessionCode)
    {
        try
        {
            var participants = await _liveQuizService.GetParticipantsAsync(sessionCode);
            return Ok(participants);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{sessionCode}/analytics/{questionId}")]
    public async Task<IActionResult> GetQuestionAnalytics(string sessionCode, Guid questionId)
    {
        try
        {
            var analytics = await _liveQuizService.GetQuestionAnalyticsAsync(sessionCode, questionId);
            return Ok(analytics);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
[HttpGet("{sessionCode}/qrcode")]
public async Task<IActionResult> GetQrCode(
    string sessionCode
)
{
    try
    {
        var filePath =
            await _qrCodeService
                .GenerateQrCodeAsync(
                    sessionCode
                );

        if (
            string.IsNullOrEmpty(filePath) ||
            !System.IO.File.Exists(filePath)
        )
        {
            return NotFound(
                new
                {
                    message =
                        "QR code not generated"
                }
            );
        }

        var bytes =
            await System.IO.File
                .ReadAllBytesAsync(
                    filePath
                );

        return File(
            bytes,
            "image/png"
        );
    }
    catch (Exception ex)
    {
        return BadRequest(
            new
            {
                message = ex.Message
            }
        );
    }
}
}