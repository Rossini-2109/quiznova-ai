using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizImportController : ControllerBase
{
    private readonly IQuizImportService _importService;
    private readonly ILogger<QuizImportController> _logger;

    public QuizImportController(IQuizImportService importService, ILogger<QuizImportController> logger)
    {
        _importService = importService;
        _logger = logger;
    }

    // POST api/QuizImport
    // Expects a multipart/form-data with file and will associate the created quiz with the authenticated teacher.
    [HttpPost]
[Authorize]
[Consumes("multipart/form-data")]
public async Task<IActionResult> ImportQuiz([FromForm] QuizImportDto request)
{
    if (request.File == null || request.File.Length == 0)
    {
        return BadRequest("No file provided.");
    }

    var teacherIdClaim = User.FindFirst(
    System.Security.Claims.ClaimTypes.NameIdentifier);;

    if (teacherIdClaim == null ||
        !Guid.TryParse(teacherIdClaim.Value, out var teacherId))
    {
        return Unauthorized("Invalid teacher identifier in token.");
    }

    try
    {
        var quizId = await _importService.ImportQuizAsync(
            request.File,
            teacherId);

        return Ok(new { QuizId = quizId });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex,
            "Error importing quiz from file {FileName}",
            request.File.FileName);

        return StatusCode(500, "Failed to import quiz.");
    }
}
}
