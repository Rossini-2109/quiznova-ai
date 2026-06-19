using backend.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
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

    [HttpGet("{id}")]
    public async Task<IActionResult> GetFolder(Guid id)
    {
        var folder = await _context.Folders
            .Include(f => f.Quizzes)
            .FirstOrDefaultAsync(f => f.Id == id);

        if (folder == null)
            return NotFound("Folder not found");

        var subFolders = await _context.Folders
            .Where(f => f.ParentFolderId == id)
            .ToListAsync();

        var quizzes = await _context.Quizzes
            .Where(q => q.FolderId == id)
            .ToListAsync();

        return Ok(new
        {
            folder,
            subFolders,
            quizzes
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderLegacyDto dto)
    {
        var folder = new backend.Models.Folder
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            TeacherId = dto.TeacherId,
            ParentFolderId = dto.ParentFolderId,
            Color = "#6366f1",
            Icon = "folder",
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();
        return Ok(folder);
    }
}

public class CreateFolderLegacyDto
{
    public string Name { get; set; } = string.Empty;
    public Guid TeacherId { get; set; }
    public Guid? ParentFolderId { get; set; }
}