using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs;
using backend.Models;
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
    public async Task<IActionResult> GetQuizBySessionCode(string sessionCode, [FromQuery] string? studentName)
    {
        try
        {
            var session = await _liveQuizService.GetSessionAsync(sessionCode);

            if (session?.Quiz == null)
            {
                return NotFound(new { message = "Quiz not found" });
            }

            var questionsList = session.Quiz.Questions.ToList();
            if (session.Quiz.ShuffleQuestions)
            {
                int seed = string.IsNullOrEmpty(studentName) ? Guid.NewGuid().GetHashCode() : studentName.GetHashCode();
                var rng = new Random(seed);
                questionsList = questionsList.OrderBy(q => rng.Next()).ToList();
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
                Questions = questionsList.Select(q => new QuestionDto
                {
                    Id = q.Id,
                    QuestionText = q.QuestionText,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    OptionE = q.OptionE,
                    QuestionType = q.QuestionType,
                    QuestionTimeLimit = q.QuestionTimeLimit,
                    QuestionImageUrl = q.QuestionImageUrl,
                    OptionAImageUrl = q.OptionAImageUrl,
                    OptionBImageUrl = q.OptionBImageUrl,
                    OptionCImageUrl = q.OptionCImageUrl,
                    OptionDImageUrl = q.OptionDImageUrl,
                    OptionEImageUrl = q.OptionEImageUrl
                }).ToList()
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
                    OptionE = q.OptionE,
                    Accuracy = accuracy,
                    CountA = questionAnswers.Count(a => string.Equals(a.SelectedOption, "A", StringComparison.OrdinalIgnoreCase)),
                    CountB = questionAnswers.Count(a => string.Equals(a.SelectedOption, "B", StringComparison.OrdinalIgnoreCase)),
                    CountC = questionAnswers.Count(a => string.Equals(a.SelectedOption, "C", StringComparison.OrdinalIgnoreCase)),
                    CountD = questionAnswers.Count(a => string.Equals(a.SelectedOption, "D", StringComparison.OrdinalIgnoreCase)),
                    CountE = questionAnswers.Count(a => string.Equals(a.SelectedOption, "E", StringComparison.OrdinalIgnoreCase)),
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

[HttpPost("{sessionCode}/finish-student")]
public async Task<IActionResult> FinishStudent(string sessionCode, [FromBody] FinishStudentRequest request)
{
    try
    {
        var session = await _context.Sessions
            .Include(s => s.Quiz)
            .ThenInclude(q => q.Questions)
            .FirstOrDefaultAsync(s => s.SessionCode == sessionCode);

        if (session == null)
            return NotFound("Session not found");

        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == request.StudentName);

        if (participant == null)
            return NotFound("Participant not found");

        // 1. Create or Find a Guest User in the database
        var guestUser = await _context.Users.FirstOrDefaultAsync(u => u.Name == participant.StudentName);
        if (guestUser == null)
        {
            guestUser = new User
            {
                Id = Guid.NewGuid(),
                Name = participant.StudentName,
                Email = $"guest_{Guid.NewGuid().ToString().Substring(0, 8)}@quiznova.local",
                PasswordHash = "GUEST_NO_PASSWORD",
                Role = "Student",
                CreatedAt = DateTime.UtcNow
            };
            _context.Users.Add(guestUser);
            await _context.SaveChangesAsync();
        }

        var participantAnswers = await _context.SessionParticipantAnswers
            .Where(a => a.SessionId == session.Id && a.SessionParticipantId == participant.Id)
            .ToListAsync();

        // Auto-submit skipped answers for any question the student did not answer
        if (session.Quiz != null)
        {
            foreach (var q in session.Quiz.Questions)
            {
                var answered = participantAnswers.Any(a => a.QuestionId == q.Id);
                if (!answered)
                {
                    var skipAnswer = new SessionParticipantAnswer
                    {
                        Id = Guid.NewGuid(),
                        SessionId = session.Id,
                        SessionParticipantId = participant.Id,
                        QuestionId = q.Id,
                        SelectedOption = string.Empty,
                        IsCorrect = false,
                        TimeTakenMs = 0,
                        SubmittedAt = DateTime.UtcNow
                    };
                    _context.SessionParticipantAnswers.Add(skipAnswer);
                    participant.SkippedAnswers++;
                    participantAnswers.Add(skipAnswer);
                }
            }
            await _context.SaveChangesAsync();
        }

        // Create compatible QuizAttempt row
        var attempt = await _context.QuizAttempts.FirstOrDefaultAsync(a => a.SessionId == session.Id && a.StudentId == guestUser.Id);
        if (attempt == null)
        {
            var totalQuestionsCount = session.Quiz?.Questions.Count ?? 0;
            attempt = new QuizAttempt
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                QuizId = session.QuizId,
                StudentId = guestUser.Id,
                EmployeeId = participant.EmployeeId,
                Score = participant.Score,
                TotalQuestions = totalQuestionsCount,
                CorrectAnswers = participant.CorrectAnswers,
                WrongAnswers = participant.WrongAnswers,
                SkippedQuestions = participant.SkippedAnswers,
                Percentage = totalQuestionsCount > 0 ? ((double)participant.CorrectAnswers / totalQuestionsCount) * 105 : 0, // normalized max score scaling
                Accuracy = (participant.CorrectAnswers + participant.WrongAnswers + participant.SkippedAnswers) > 0 ? ((double)participant.CorrectAnswers / (participant.CorrectAnswers + participant.WrongAnswers + participant.SkippedAnswers)) * 100 : 0,
                CompletionStatus = "Completed",
                TimeTakenMilliseconds = (int)(participant.AverageTimeTakenMs * (participant.CorrectAnswers + participant.WrongAnswers + participant.SkippedAnswers)),
                TimeTakenSeconds = (int)((participant.AverageTimeTakenMs * (participant.CorrectAnswers + participant.WrongAnswers + participant.SkippedAnswers)) / 1000),
                Completed = true,
                Rank = 1,
                StartedAt = session.StartedAt ?? session.CreatedAt,
                SubmittedAt = DateTime.UtcNow,
                CompletedAt = DateTime.UtcNow,
                PassMark = 50
            };
            _context.QuizAttempts.Add(attempt);
            await _context.SaveChangesAsync();

            // Save answers to QuizAnswer/StudentAnswer
            foreach (var pa in participantAnswers)
            {
                var studentAnswer = new StudentAnswer
                {
                    Id = Guid.NewGuid(),
                    StudentId = participant.Id,
                    StudentName = participant.StudentName,
                    QuestionId = pa.QuestionId,
                    SelectedOption = pa.SelectedOption,
                    IsCorrect = pa.IsCorrect,
                    TimeTaken = pa.TimeTakenMs,
                    ScoreEarned = pa.IsCorrect ? (1000 - (pa.TimeTakenMs / 100)) : 0,
                    SessionId = session.Id
                };
                _context.StudentAnswers.Add(studentAnswer);

                var quizAnswer = new QuizAnswer
                {
                    Id = Guid.NewGuid(),
                    AttemptId = attempt.Id,
                    QuestionId = pa.QuestionId,
                    SelectedAnswer = pa.SelectedOption,
                    IsCorrect = pa.IsCorrect,
                    ResponseTimeMs = pa.TimeTakenMs
                };
                _context.QuizAnswers.Add(quizAnswer);
            }
            await _context.SaveChangesAsync();
        }

        // Create QuizResult row for results page compatibility
        var exists = await _context.QuizResults.AnyAsync(r => r.SessionId == session.Id && r.StudentId == participant.Id);
        if (!exists)
        {
            var quizResult = new QuizResult
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                StudentId = participant.Id,
                StudentName = participant.StudentName,
                EmployeeId = participant.EmployeeId,
                QuizId = session.QuizId,
                Score = participant.Score,
                CorrectCount = participant.CorrectAnswers,
                IncorrectCount = participant.WrongAnswers,
                AverageTime = participant.AverageTimeTakenMs,
                Rank = 1,
                CompletedAt = DateTime.UtcNow
            };

            _context.QuizResults.Add(quizResult);
            await _context.SaveChangesAsync();
        }

        return Ok(new { attemptId = attempt.Id });
    }
    catch (Exception ex)
    {
        return BadRequest(new { message = ex.Message });
    }
}
}

public class FinishStudentRequest
{
    public string StudentName { get; set; } = string.Empty;
}