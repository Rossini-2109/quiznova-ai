using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using backend.Helpers;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public QuizController(ApplicationDbContext context)
    {
        _context = context;
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
            Description = dto.Description,
            Difficulty = dto.Difficulty,
            TimeLimit = dto.TimeLimit,
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
            QuestionType = dto.QuestionType
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
                q.QuizCode == quizCode &&
                q.Status == "Published");

        if (quiz == null)
            return NotFound("Quiz not found");

        return Ok(new
        {
            quiz.Id,
            quiz.Title,
            quiz.Difficulty,
            QuestionCount = quiz.Questions.Count,
            quiz.TimeLimit
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
        .FirstOrDefaultAsync(q => q.Id == id);

    if (quiz == null)
        return NotFound("Quiz not found");

    quiz.Title = dto.Title;
    quiz.Description = dto.Description;
    quiz.Difficulty = dto.Difficulty;
    quiz.TimeLimit = dto.TimeLimit;

    await _context.SaveChangesAsync();

    return Ok(new
    {
        Message = "Quiz updated successfully"
    });
}



    [HttpPut("publish/{id}")]
    public async Task<IActionResult> PublishQuiz(Guid id)
    {
        try
        {
            var quiz = await _context.Quizzes
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null)
            {
                return NotFound("Quiz not found");
            }

            quiz.Status = "Published";

            if (string.IsNullOrEmpty(quiz.QuizCode))
            {
                quiz.QuizCode =
                    QuizCodeGenerator.GenerateQuizCode();
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Quiz published successfully",
                QuizCode = quiz.QuizCode,
                Quiz = quiz
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
    }

    [HttpDelete("{id}")]
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