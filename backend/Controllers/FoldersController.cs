using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using backend.DTOs;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FoldersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FoldersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET api/folders/library-stats
    [HttpGet("library-stats")]
    public async Task<IActionResult> GetLibraryStats()
    {
        var totalQuizzes = await _context.Quizzes.CountAsync();
        var draftQuizzes = await _context.Quizzes.CountAsync(q => q.Status == "Draft");
        var publishedQuizzes = await _context.Quizzes.CountAsync(q => q.Status == "Published");
        var totalFolders = await _context.Folders.CountAsync();
        var totalAttempts = await _context.QuizAttempts.CountAsync();
        var recentQuizzes = await _context.Quizzes
            .OrderByDescending(q => q.CreatedAt)
            .Take(5)
            .Select(q => new { q.Id, q.Title, q.Status, q.CreatedAt })
            .ToListAsync();

        var stats = new {
            totalQuizzes,
            draftQuizzes,
            publishedQuizzes,
            totalFolders,
            totalAttempts,
            recentQuizzes
        };
        return Ok(stats);
    }

    // GET api/folders
    // Returns folder hierarchy with quizzes inside each folder
    [HttpGet]
    public async Task<IActionResult> GetFolders()
    {
        var folders = await _context.Folders
            .Include(f => f.Quizzes)
            .OrderBy(f => f.Name)
            .ToListAsync();

        // Build tree structure
        var dict = folders.ToDictionary(f => f.Id, f => new {
            id = f.Id,
            name = f.Name,
            color = f.Color ?? "#6366f1",
            icon = f.Icon ?? "folder",
            createdAt = f.CreatedAt,
            lastModifiedAt = f.LastModifiedAt,
            quizCount = f.Quizzes.Count,
            quizzes = f.Quizzes.Select(q => new {
                id = q.Id,
                title = q.Title,
                description = q.Description,
                status = q.Status,
                difficulty = q.Difficulty,
                questionCount = q.Questions.Count,
                createdAt = q.CreatedAt,
                folderId = q.FolderId
            }).ToList(),
            subFolders = new List<object>(),
            parentFolderId = f.ParentFolderId
        });

        List<object> roots = new();
        foreach (var f in folders)
        {
            if (f.ParentFolderId != null && dict.ContainsKey(f.ParentFolderId.Value))
            {
                var parent = dict[f.ParentFolderId.Value];
                ((List<object>)parent.GetType().GetProperty("subFolders").GetValue(parent)).Add(dict[f.Id]);
            }
            else
            {
                roots.Add(dict[f.Id]);
            }
        }
        return Ok(roots);
    }

    // GET api/folders/unassigned-quizzes
    [HttpGet("unassigned-quizzes")]
    public async Task<IActionResult> GetUnassignedQuizzes()
    {
        var quizzes = await _context.Quizzes
            .Where(q => q.FolderId == null)
            .Select(q => new {
                id = q.Id,
                title = q.Title,
                description = q.Description,
                status = q.Status,
                difficulty = q.Difficulty,
                questionCount = q.Questions.Count,
                createdAt = q.CreatedAt,
                folderId = q.FolderId
            })
            .ToListAsync();
        return Ok(quizzes);
    }

    // GET api/folders/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetFolder(Guid id)
    {
        var folder = await _context.Folders
            .Include(f => f.Quizzes)
            .FirstOrDefaultAsync(f => f.Id == id);
        if (folder == null) return NotFound("Folder not found");

        var result = new {
            id = folder.Id,
            name = folder.Name,
            color = folder.Color ?? "#6366f1",
            icon = folder.Icon ?? "folder",
            createdAt = folder.CreatedAt,
            lastModifiedAt = folder.LastModifiedAt,
            quizCount = folder.Quizzes.Count,
            quizzes = folder.Quizzes.Select(q => new {
                id = q.Id,
                title = q.Title,
                description = q.Description,
                status = q.Status,
                difficulty = q.Difficulty,
                questionCount = q.Questions.Count,
                createdAt = q.CreatedAt,
                folderId = q.FolderId
            })
        };
        return Ok(result);
    }

    // POST api/folders
    [Authorize(Roles = "Teacher")]
    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderDto dto)
    {
        var folder = new Folder
{
    Id = Guid.NewGuid(),
    Name = dto.Name,
    TeacherId = Guid.Empty, // replace later with actual teacher id
    Color = dto.Color ?? "#6366f1",
    Icon = dto.Icon ?? "folder",
    ParentFolderId = dto.ParentFolderId,
    CreatedAt = DateTime.UtcNow,
    LastModifiedAt = DateTime.UtcNow
};
        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();
        return Ok(folder);
    }

    // PUT api/folders/{id}
    [Authorize(Roles = "Teacher")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderDto dto)
    {
        var folder = await _context.Folders.FindAsync(id);
        if (folder == null) return NotFound("Folder not found");
        folder.Name = dto.Name ?? folder.Name;
        folder.Color = dto.Color ?? folder.Color;
        folder.Icon = dto.Icon ?? folder.Icon;
    folder.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(folder);
    }

    // POST api/folders/{id}/assign
    // Move the given quizzes into this folder.
    [Authorize(Roles = "Teacher")]
    [HttpPost("{id}/assign")]
    public async Task<IActionResult> AssignQuizzes(Guid id, [FromBody] AssignQuizzesDto dto)
    {
        var folder = await _context.Folders.FindAsync(id);
        if (folder == null) return NotFound("Folder not found");

        if (dto.QuizIds == null || dto.QuizIds.Count == 0)
            return BadRequest("No quizzes provided.");

        var quizzes = await _context.Quizzes
            .Where(q => dto.QuizIds.Contains(q.Id))
            .ToListAsync();

        foreach (var quiz in quizzes)
        {
            quiz.FolderId = id;
        }
        folder.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { Assigned = quizzes.Count });
    }

    // POST api/folders/{id}/remove-quiz/{quizId}
    // Detach a quiz from this folder (back to unassigned).
    [Authorize(Roles = "Teacher")]
    [HttpPost("{id}/remove-quiz/{quizId}")]
    public async Task<IActionResult> RemoveQuizFromFolder(Guid id, Guid quizId)
    {
        var quiz = await _context.Quizzes.FirstOrDefaultAsync(q => q.Id == quizId && q.FolderId == id);
        if (quiz == null) return NotFound("Quiz not found in this folder");
        quiz.FolderId = null;
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Quiz removed from folder" });
    }

    // DELETE api/folders/{id}
    [Authorize(Roles = "Teacher")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        var folder = await _context.Folders.Include(f => f.Quizzes).FirstOrDefaultAsync(f => f.Id == id);
        if (folder == null) return NotFound("Folder not found");
        // Remove folder reference from contained quizzes
        foreach (var quiz in folder.Quizzes)
        {
            quiz.FolderId = null;
        }
        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();
        return Ok(new { Message = "Folder deleted" });
    }
}
