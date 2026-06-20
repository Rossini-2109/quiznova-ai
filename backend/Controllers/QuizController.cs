using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using backend.Helpers;
using QRCoder;
using System.Drawing;
using System.Drawing.Imaging;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILiveQuizService _liveQuizService;

    public QuizController(ApplicationDbContext context, ILiveQuizService liveQuizService)
    {
        _context = context;
        _liveQuizService = liveQuizService;
    }

    [Authorize(Roles = "Teacher")]
[HttpPost("create")]
public async Task<IActionResult> CreateQuiz(
    [FromBody] CreateQuizDto dto)
{
    try
    {
        var teacherIdClaim =
            User.FindFirst(ClaimTypes.NameIdentifier);

        if (teacherIdClaim == null)
        {
            return Unauthorized();
        }

        var quiz = new Quiz
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Status = "Draft",
            QuizCode = string.Empty,
            TeacherId = Guid.TryParse(teacherIdClaim.Value, out var parsedId) ? parsedId : Guid.Empty,
            CreatedAt = DateTime.UtcNow
        };

        _context.Quizzes.Add(quiz);

        await _context.SaveChangesAsync();

        return Ok(quiz);
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            Message = "Error creating quiz",
            Error = ex.Message
        });
    }
}
    [HttpPost("add-question")]
public async Task<IActionResult> AddQuestion(
    [FromBody] CreateQuestionDto dto)
{
    Console.WriteLine("STEP 1");

    try
    {
        Console.WriteLine("STEP 2");

        var quizExists = await _context.Quizzes
            .AnyAsync(q => q.Id == dto.QuizId);

        Console.WriteLine("STEP 3");

        if (!quizExists)
        {
            Console.WriteLine("QUIZ NOT FOUND");
            return NotFound("Quiz not found");
        }
        Console.WriteLine(
            $"Question Time Limit: {dto.QuestionTimeLimit}"
        );

        var question = new Question
        {
            Id = Guid.NewGuid(),
            QuizId = dto.QuizId,
            QuestionText = dto.QuestionText,
            OptionA = dto.OptionA,
            OptionB = dto.OptionB,
            OptionC = dto.OptionC,
            OptionD = dto.OptionD,
            CorrectAnswer = dto.CorrectAnswer,
            Explanation = dto.Explanation,
            QuestionType = dto.QuestionType,
            QuestionTimeLimit = dto.QuestionTimeLimit,
            QuestionImageUrl = dto.QuestionImageUrl,
            OptionAImageUrl = dto.OptionAImageUrl,
            OptionBImageUrl = dto.OptionBImageUrl,
            OptionCImageUrl = dto.OptionCImageUrl,
            OptionDImageUrl = dto.OptionDImageUrl,
        };

        Console.WriteLine("STEP 4");

        _context.Questions.Add(question);

        Console.WriteLine("STEP 5");

        await _context.SaveChangesAsync();

        Console.WriteLine("STEP 6");

        return Ok(question);
    }
    catch (Exception ex)
    {
        Console.WriteLine("ERROR:");
        Console.WriteLine(ex.ToString());

        return StatusCode(500, ex.ToString());
    }
}

    [HttpGet("all")]
    public async Task<IActionResult> GetAllQuizzes()
    {
        try
        {
            var quizzes = await _context.Quizzes.ToListAsync();
            return Ok(quizzes);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Message = "Error fetching quizzes",
                Error = ex.Message
            });
        }
    }

    [HttpGet("code/{quizCode}")]
    public async Task<IActionResult> GetQuizByCode(string quizCode)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q =>
                q.QuizCode == quizCode && q.Status == "Published");

        if (quiz == null)
            return NotFound("Quiz not found");

        return Ok(new
        {
            quiz.Id,
            quiz.Title,
            quiz.Description,
            quiz.Difficulty,
            quiz.TimeLimit,
            quiz.Status,
            quiz.QuizCode,
            Questions = quiz.Questions.Select(q => new {
                q.Id,
                q.QuestionText,
                q.OptionA,
                q.OptionB,
                q.OptionC,
                q.OptionD,
                q.QuestionType,
                q.QuestionTimeLimit,
                q.QuestionImageUrl,
                q.OptionAImageUrl,
                q.OptionBImageUrl,
                q.OptionCImageUrl,
                q.OptionDImageUrl
            })
        });
    }

   [HttpGet("{id}")]
public async Task<IActionResult> GetQuiz(Guid id)
{
    Console.WriteLine($"GET QUIZ HIT: {id}");

    var quiz = await _context.Quizzes
        .Include(q => q.Questions)
        .FirstOrDefaultAsync(q => q.Id == id);

    if (quiz == null)
    {
        Console.WriteLine("QUIZ NOT FOUND");
        return NotFound("Quiz not found");
    }

    return Ok(quiz);
}
    [HttpPut("{id}")]
public async Task<IActionResult> UpdateQuiz(
    Guid id,
    [FromBody] UpdateQuizDto dto)
{
    var quiz = await _context.Quizzes
        .Include(q => q.Questions)
        .FirstOrDefaultAsync(q => q.Id == id);

    if (quiz == null)
        return NotFound("Quiz not found");

    quiz.Title = dto.Title;
    quiz.Description = dto.Description;
    quiz.Difficulty = dto.Difficulty;
    quiz.TimeLimit = dto.TimeLimit;
    if (dto.FolderId != null) quiz.FolderId = dto.FolderId;
    if (dto.Tags != null) quiz.Tags = dto.Tags;
    if (dto.Instructions != null) quiz.Instructions = dto.Instructions;
    if (dto.DefaultQuestionTimeSeconds.HasValue) quiz.DefaultQuestionTimeSeconds = dto.DefaultQuestionTimeSeconds.Value;
    if (dto.MaxAttempts.HasValue) quiz.MaxAttempts = dto.MaxAttempts.Value;
    if (dto.ShuffleQuestions.HasValue) quiz.ShuffleQuestions = dto.ShuffleQuestions.Value;

    if (dto.Questions != null)
    {
        var existingQuestions = quiz.Questions.ToList();
        var incomingIds = dto.Questions
            .Where(q => q.Id.HasValue)
            .Select(q => q.Id!.Value)
            .ToHashSet();

        // Delete removed questions
        foreach (var existingQ in existingQuestions)
        {
            if (!incomingIds.Contains(existingQ.Id))
            {
                _context.Questions.Remove(existingQ);
            }
        }

        // Add or Update questions
        int orderIndex = 0;
        foreach (var incomingQ in dto.Questions)
        {
            Question? targetQ = null;
            if (incomingQ.Id.HasValue)
            {
                targetQ = existingQuestions.FirstOrDefault(q => q.Id == incomingQ.Id.Value);
            }

            if (targetQ == null)
            {
                targetQ = new Question
                {
                    Id = incomingQ.Id ?? Guid.NewGuid(),
                    QuizId = id
                };
                _context.Questions.Add(targetQ);
            }

            targetQ.QuestionText = incomingQ.QuestionText;
            targetQ.OptionA = incomingQ.OptionA;
            targetQ.OptionB = incomingQ.OptionB;
            targetQ.OptionC = incomingQ.OptionC;
            targetQ.OptionD = incomingQ.OptionD;
            targetQ.OptionE = incomingQ.OptionE;
            targetQ.CorrectAnswer = incomingQ.CorrectAnswer;
            targetQ.QuestionTimeLimit = incomingQ.QuestionTimeLimit;
            targetQ.OrderIndex = orderIndex++;
            targetQ.QuestionImageUrl = incomingQ.QuestionImageUrl;
            targetQ.OptionAImageUrl = incomingQ.OptionAImageUrl;
            targetQ.OptionBImageUrl = incomingQ.OptionBImageUrl;
            targetQ.OptionCImageUrl = incomingQ.OptionCImageUrl;
            targetQ.OptionDImageUrl = incomingQ.OptionDImageUrl;
            targetQ.OptionEImageUrl = incomingQ.OptionEImageUrl;
        }
    }

    await _context.SaveChangesAsync();

    return Ok(new
    {
        Message = "Quiz updated successfully"
    });
}



   [HttpPut("publish/{id}")]
public async Task<IActionResult> PublishQuiz(Guid id, [FromBody] PublishQuizDto dto)
{
    try
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null)
            return NotFound("Quiz not found");

        quiz.Status = "Published";
        if (dto != null)
        {
            quiz.MaxAttempts = dto.MaxAttempts;
            quiz.ShuffleQuestions = dto.ShuffleQuestions;
        }

        await _context.SaveChangesAsync();

        // Create live session
        var session = await _liveQuizService.CreateSessionAsync(
            quiz.Id,
            quiz.TeacherId
        );

        return Ok(new
        {
            success = true,
            message = "Quiz published successfully",

            sessionId = session.Id,
            quizCode = session.SessionCode,

            quizId = quiz.Id,
            status = quiz.Status
        });
    }
    catch (Exception ex)
    {
        return StatusCode(500, new
        {
            Message = "Error publishing quiz",
            Error = ex.Message
        });
    }
}    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteQuiz(Guid id)
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == id);

        if (quiz == null)
        {
            return NotFound("Quiz not found");
        }

        _context.Quizzes.Remove(quiz);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            Message = "Quiz deleted successfully"
        });
    }

    [HttpPost("start")]
    public async Task<IActionResult> StartAttempt(
        [FromBody] StartAttemptDto dto)
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
    .Include(q => q.Questions)
    .FirstOrDefaultAsync(q => q.Id == dto.QuizId);
            if (quiz == null)
            {
                return NotFound("Quiz not found");
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
}