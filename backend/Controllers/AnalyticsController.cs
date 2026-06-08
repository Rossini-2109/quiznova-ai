using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Data;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnalyticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET api/analytics/quiz/{quizId}
    [HttpGet("quiz/{quizId:guid}")]
    public async Task<IActionResult> GetQuizAnalytics([FromRoute] Guid quizId)
    {
        // Get attempts for the quiz
        var attempts = await _context.QuizAttempts
            .Where(a => a.QuizId == quizId)
            .ToListAsync();

        if (!attempts.Any())
        {
            return NotFound("No attempts found for this quiz.");
        }

        var totalAttempts = attempts.Count;
        var averageScore = attempts.Average(a => a.Score);
        var highestScore = attempts.Max(a => a.Score);
        var lowestScore = attempts.Min(a => a.Score);

        var analytics = new QuizAnalyticsDto
        {
            QuizId = quizId,
            TotalAttempts = totalAttempts,
            AverageScore = Math.Round(averageScore, 2),
            HighestScore = highestScore,
            LowestScore = lowestScore,
            // Additional metrics can be added later
        };

        return Ok(analytics);
    }
}
