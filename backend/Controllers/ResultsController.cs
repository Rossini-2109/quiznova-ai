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
            .Where(x => x.QuizId == quizId)
            .Select(x => new
            {
                x.StudentId,
                x.Score,
                x.Percentage,
                x.CorrectAnswers,
                x.TotalQuestions,
                x.SubmittedAt
            })
            .ToListAsync();

        return Ok(results);
    }
}