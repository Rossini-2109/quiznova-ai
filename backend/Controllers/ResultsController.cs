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
    public async Task<IActionResult> GetQuizResults(Guid quizId)
    {
        var results = await _context.QuizAttempts
            .Include(x => x.Student)
            .Where(x => x.QuizId == quizId)
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
                x.SubmittedAt
            })
            .ToListAsync();

        return Ok(results);
    }
}