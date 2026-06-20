using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttemptsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AttemptsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("{attemptId}")]
    public async Task<IActionResult> GetAttempt(Guid attemptId)
    {
        var attempt = await _context.QuizAttempts
            .FirstOrDefaultAsync(a => a.Id == attemptId);

        if (attempt == null)
            return NotFound("Attempt not found");

        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == attempt.QuizId);

        if (quiz == null)
            return NotFound("Quiz not found");

        var questionsList = quiz.Questions.ToList();
        if (quiz.ShuffleQuestions)
        {
            var rng = new Random(attemptId.GetHashCode());
            questionsList = questionsList.OrderBy(q => rng.Next()).ToList();
        }

        return Ok(new
        {
            id = quiz.Id,
            title = quiz.Title,
            timeLimit = quiz.TimeLimit,

            questions = questionsList.Select(q => new
            {
                id = q.Id,
                questionText = q.QuestionText,
                optionA = q.OptionA,
                optionB = q.OptionB,
                optionC = q.OptionC,
                optionD = q.OptionD,
                optionE = q.OptionE
            })
        });
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitQuiz(
        SubmitQuizDto dto
    )
    {
        var attempt = await _context.QuizAttempts
            .FirstOrDefaultAsync(x => x.Id == dto.AttemptId);

        if (attempt == null)
            return NotFound("Attempt not found");

        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == attempt.QuizId);

        if (quiz == null)
            return NotFound("Quiz not found");

        // Prevent double submit
        bool alreadySubmitted =
            await _context.QuizAnswers
                .AnyAsync(a => a.AttemptId == attempt.Id);

        if (alreadySubmitted)
        {
            return BadRequest("Quiz already submitted");
        }

        int correctAnswers = 0;

        foreach (var question in quiz.Questions)
        {
            if (
                dto.Answers.TryGetValue(
                    question.Id.ToString(),
                    out string? selected
                )
            )
            {
                bool isCorrect =
                    selected == question.CorrectAnswer;

                if (isCorrect)
                    correctAnswers++;

                _context.QuizAnswers.Add(
                    new QuizAnswer
                    {
                        Id = Guid.NewGuid(),
                        AttemptId = attempt.Id,
                        QuestionId = question.Id,
                        SelectedAnswer = selected,
                        IsCorrect = isCorrect
                    });
            }
        }

        // Count only submitted answers
        int totalQuestions = quiz.Questions.Count;

        int score = correctAnswers * 5;

        double percentage =
            totalQuestions == 0
                ? 0
                : ((double)correctAnswers /
                totalQuestions) * 100;

        attempt.Score = score;
        attempt.TotalQuestions = totalQuestions;
        attempt.CorrectAnswers = correctAnswers;
        attempt.Percentage = percentage;
        attempt.SubmittedAt = DateTime.UtcNow;

        attempt.TimeTakenMilliseconds =
    (int)(
        DateTime.UtcNow -
        attempt.StartedAt
    ).TotalMilliseconds;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Score = score,
            CorrectAnswers = correctAnswers,
            WrongAnswers =
                totalQuestions - correctAnswers,
            Percentage = percentage
        });
    }
    [HttpGet("review/{attemptId}")]
    public async Task<IActionResult> ReviewAttempt(
        Guid attemptId
    )
    {
        var answers = await _context.QuizAnswers
            .Where(a => a.AttemptId == attemptId)
            .Join(
                _context.Questions,
                a => a.QuestionId,
                q => q.Id,
                (a, q) => new
                {
                    q.QuestionText,
                    YourAnswer = a.SelectedAnswer,
                    q.CorrectAnswer,
                    q.Explanation,
                    a.IsCorrect
                }
            )
            .ToListAsync();

        return Ok(answers);
    }

   [HttpGet("result/{attemptId}")]
public async Task<IActionResult> GetResult(Guid attemptId)
{
    var attempt = await _context.QuizAttempts.FindAsync(attemptId);

    if (attempt == null)
        return NotFound();

    return Ok(new
    {
        attempt.Id,
        attempt.Score,
        attempt.CorrectAnswers,
        WrongAnswers = attempt.TotalQuestions - attempt.CorrectAnswers,
        attempt.Percentage,
        attempt.StartedAt,
        attempt.SubmittedAt,
        attempt.TimeTakenMilliseconds
    });
}

[HttpPost("share/{attemptId}")]
public async Task<IActionResult> CreateShareToken(Guid attemptId)
{
    var attempt = await _context.QuizAttempts.FindAsync(attemptId);

    if (attempt == null)
        return NotFound("Attempt not found");

    var token = new ShareToken
    {
        AttemptId = attemptId
    };

    _context.ShareTokens.Add(token);

    await _context.SaveChangesAsync();

    var request = HttpContext.Request;
    var baseUrl = $"{request.Scheme}://{request.Host}";
    var shareUrl = $"{baseUrl}/share/{token.Token}";

    return Ok(new
    {
        ShareUrl = shareUrl,
        Token = token.Token
    });
} 
    [HttpPost("start")]
public async Task<IActionResult> StartAttempt(
    [FromBody] StartAttemptDto dto
)
{
    try
    {
        Guid studentId = Guid.Empty;
        var studentIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (studentIdClaim != null)
        {
            studentId = Guid.Parse(studentIdClaim.Value);
        }

        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == dto.QuizId);

        if (quiz == null)
        {
            return NotFound("Quiz not found");
        }

        var existingAttemptsCount = await _context.QuizAttempts
            .CountAsync(a => a.QuizId == dto.QuizId && a.StudentId == studentId);

        if (existingAttemptsCount >= quiz.MaxAttempts)
        {
            return BadRequest($"Maximum attempts limit of {quiz.MaxAttempts} reached.");
        }

        var attempt = new QuizAttempt
        {
            Id = Guid.NewGuid(),
            QuizId = dto.QuizId,
            StudentId = studentId,
            Score = 0,
            TotalQuestions = 0,
            CorrectAnswers = 0,
            Percentage = 0,
            TimeTakenMilliseconds = 0,
            StartedAt = DateTime.UtcNow
        };

        _context.QuizAttempts.Add(attempt);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            id = attempt.Id,
            quizId = attempt.QuizId,
            studentId = attempt.StudentId,
            startedAt = attempt.StartedAt
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            Message = "Error starting quiz attempt",
            Error = ex.Message
        });
    }
}

[Authorize]
[HttpGet("student")]
public async Task<IActionResult> GetStudentAttempts()
{
    var studentIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (!Guid.TryParse(studentIdStr, out var studentGuid))
    {
        return BadRequest("Invalid student identifier.");
    }
    var attempts = await _context.QuizAttempts
        .Where(a => a.StudentId == studentGuid)
        .OrderByDescending(a => a.SubmittedAt)
        .ToListAsync();

    return Ok(attempts);
}

[Authorize]
[HttpGet("stats")]
public async Task<IActionResult> GetStats()
{
    var studentId = Guid.Parse(
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!
            .Value
    );

    var attempts = await _context.QuizAttempts
        .Where(a => a.StudentId == studentId)
        .ToListAsync();

    return Ok(new
    {
        TotalQuizzes = attempts.Count,

        HighestScore = attempts.Any()
            ? attempts.Max(a => a.Score)
            : 0,

        AverageScore = attempts.Any()
            ? attempts.Average(a => a.Score)
            : 0,

        Attempts = attempts.Count
    });
}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateQuiz(
        Guid id,
        UpdateQuizDto dto)
    {
        var quiz = await _context.Quizzes.FindAsync(id);

        if (quiz == null)
            return NotFound();

        quiz.Title = dto.Title;
        quiz.Description = dto.Description;
        quiz.Difficulty = dto.Difficulty;
        quiz.TimeLimit = dto.TimeLimit;

        await _context.SaveChangesAsync();

        return Ok(quiz);
    }


    [HttpGet("all")]
    public async Task<IActionResult> GetAllAttempts()
    {
        var attempts = await _context.QuizAttempts
            .OrderByDescending(a => a.StartedAt)
            .ToListAsync();

        return Ok(attempts);
    }
}