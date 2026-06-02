using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using backend.Helpers;
using Microsoft.AspNetCore.Authorization;

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
    public async Task<IActionResult> CreateQuiz([FromBody] CreateQuizDto dto)
    {
        try
        {
            var quiz = new Quiz
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                Difficulty = dto.Difficulty,
                TimeLimit = dto.TimeLimit,
                Status = "Draft",
                QuizCode = QuizCodeGenerator.GenerateQuizCode()
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
    public async Task<IActionResult> AddQuestion([FromBody] CreateQuestionDto dto)
    {
        try
        {
            var quizExists = await _context.Quizzes
                .AnyAsync(q => q.Id == dto.QuizId);

            if (!quizExists)
            {
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

            _context.Questions.Add(question);
            await _context.SaveChangesAsync();

            return Ok(question);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Message = "Error adding question",
                Error = ex.Message
            });
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuiz(Guid id)
    {
        try
        {
            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quiz == null)
            {
                return NotFound("Quiz not found");
            }

            return Ok(quiz);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Message = "Error fetching quiz",
                Error = ex.Message
            });
        }
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

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Quiz published successfully",
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
}