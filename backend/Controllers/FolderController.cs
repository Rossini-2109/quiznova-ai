using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FolderController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FolderController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("library")]
    public async Task<IActionResult> GetLibrary()
    {
        var folders = await _context.Folders
            .Include(f => f.Quizzes)
            .OrderBy(f => f.Name)
            .ToListAsync();

        var totalQuizzes =
            await _context.Quizzes.CountAsync();

        var drafts =
            await _context.Quizzes
                .CountAsync(q =>
                    q.Status == "Draft");

        var published =
            await _context.Quizzes
                .CountAsync(q =>
                    q.Status == "Published");

        return Ok(new
        {
            totalQuizzes,
            drafts,
            published,
            folders
        });
    }
}