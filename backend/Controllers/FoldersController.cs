using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class FoldersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public FoldersController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ─────────────────────────────────────────────
    // GET: api/folders/library-stats
    // ─────────────────────────────────────────────
    [HttpGet("library-stats")]
    public async Task<IActionResult> GetLibraryStats()
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var quizzes = await _context.Quizzes
            .Where(q => q.TeacherId == teacherId.Value)
            .ToListAsync();

        var folders = await _context.Folders
            .Where(f => f.TeacherId == teacherId.Value)
            .Include(f => f.Quizzes)
            .ToListAsync();

        var attempts = await _context.QuizAttempts
            .Where(a => quizzes.Select(q => q.Id).Contains(a.QuizId))
            .ToListAsync();

        // Recent activity: last 5 modified quizzes
        var recentQuizzes = quizzes
            .OrderByDescending(q => q.CreatedAt)
            .Take(5)
            .Select(q => new { q.Id, q.Title, q.Status, q.CreatedAt })
            .ToList();

        return Ok(new
        {
            TotalQuizzes = quizzes.Count,
            DraftQuizzes = quizzes.Count(q => q.Status == "Draft"),
            PublishedQuizzes = quizzes.Count(q => q.Status == "Published"),
            TotalFolders = folders.Count,
            TotalAttempts = attempts.Count,
            RecentQuizzes = recentQuizzes
        });
    }

    // ─────────────────────────────────────────────
    // GET: api/folders
    // ─────────────────────────────────────────────
    [HttpGet]
    public async Task<IActionResult> GetFolders()
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var allFolders = await _context.Folders
            .Where(f => f.TeacherId == teacherId.Value)
            .Include(f => f.Quizzes)
                .ThenInclude(q => q.Questions)
            .ToListAsync();

        var rootFolders = allFolders
            .Where(f => f.ParentFolderId == null)
            .Select(f => MapFolderToDto(f, allFolders))
            .ToList();

        return Ok(rootFolders);
    }

    // ─────────────────────────────────────────────
    // GET: api/folders/{id}/analytics
    // ─────────────────────────────────────────────
    [HttpGet("{id}/analytics")]
    public async Task<IActionResult> GetFolderAnalytics(Guid id)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var folder = await _context.Folders
            .Include(f => f.Quizzes)
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId.Value);

        if (folder == null) return NotFound("Folder not found.");

        var quizIds = folder.Quizzes.Select(q => q.Id).ToList();
        var attempts = await _context.QuizAttempts
            .Where(a => quizIds.Contains(a.QuizId))
            .ToListAsync();

        return Ok(new
        {
            FolderId = folder.Id,
            FolderName = folder.Name,
            TotalQuizzes = folder.Quizzes.Count,
            DraftCount = folder.Quizzes.Count(q => q.Status == "Draft"),
            PublishedCount = folder.Quizzes.Count(q => q.Status == "Published"),
            TotalAttempts = attempts.Count,
            TotalParticipants = attempts.Select(a => a.StudentId).Distinct().Count(),
            AverageScore = attempts.Any() ? Math.Round(attempts.Average(a => a.Percentage), 1) : 0,
            LastActivity = attempts.Any() ? attempts.Max(a => a.SubmittedAt) : (DateTime?)null
        });
    }

    // ─────────────────────────────────────────────
    // POST: api/folders
    // ─────────────────────────────────────────────
    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest("Folder name is required.");

        if (request.ParentFolderId.HasValue)
        {
            var parentExists = await _context.Folders
                .AnyAsync(f => f.Id == request.ParentFolderId.Value && f.TeacherId == teacherId.Value);
            if (!parentExists) return BadRequest("Parent folder not found.");
        }

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            TeacherId = teacherId.Value,
            ParentFolderId = request.ParentFolderId,
            Color = request.Color ?? "#6366f1",
            Icon = request.Icon ?? "folder",
            CreatedAt = DateTime.UtcNow,
            LastModifiedAt = DateTime.UtcNow
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFolders), null, folder);
    }

    // ─────────────────────────────────────────────
    // PUT: api/folders/{id}
    // ─────────────────────────────────────────────
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderRequest request)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId.Value);

        if (folder == null) return NotFound("Folder not found.");

        if (!string.IsNullOrWhiteSpace(request.Name))
            folder.Name = request.Name.Trim();

        if (request.Color != null) folder.Color = request.Color;
        if (request.Icon != null) folder.Icon = request.Icon;

        if (request.ParentFolderId != null)
        {
            if (request.ParentFolderId == Guid.Empty)
            {
                folder.ParentFolderId = null;
            }
            else
            {
                if (request.ParentFolderId == id)
                    return BadRequest("A folder cannot be its own parent.");

                var parentExists = await _context.Folders
                    .AnyAsync(f => f.Id == request.ParentFolderId && f.TeacherId == teacherId.Value);
                if (!parentExists) return BadRequest("Parent folder not found.");

                folder.ParentFolderId = request.ParentFolderId;
            }
        }

        folder.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(folder);
    }

    // ─────────────────────────────────────────────
    // DELETE: api/folders/{id}
    // ─────────────────────────────────────────────
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId.Value);

        if (folder == null) return NotFound("Folder not found.");

        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Folder deleted successfully." });
    }

    // ─────────────────────────────────────────────
    // POST: api/folders/{id}/add-quiz
    // ─────────────────────────────────────────────
    [HttpPost("{id}/add-quiz")]
    public async Task<IActionResult> AddQuizToFolder(Guid id, [FromBody] AddQuizToFolderRequest request)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId.Value);
        if (folder == null) return NotFound("Folder not found.");

        foreach (var quizId in request.QuizIds)
        {
            var quiz = await _context.Quizzes
                .FirstOrDefaultAsync(q => q.Id == quizId && q.TeacherId == teacherId.Value);
            if (quiz != null)
            {
                quiz.FolderId = id;
            }
        }

        folder.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Quizzes added to folder successfully." });
    }

    // ─────────────────────────────────────────────
    // DELETE: api/folders/{id}/remove-quiz/{quizId}
    // ─────────────────────────────────────────────
    [HttpDelete("{id}/remove-quiz/{quizId}")]
    public async Task<IActionResult> RemoveQuizFromFolder(Guid id, Guid quizId)
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId.Value);
        if (folder == null) return NotFound("Folder not found.");

        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == quizId && q.FolderId == id && q.TeacherId == teacherId.Value);
        if (quiz == null) return NotFound("Quiz not found in this folder.");

        quiz.FolderId = null;
        folder.LastModifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Quiz removed from folder (quiz still exists in library)." });
    }

    // ─────────────────────────────────────────────
    // GET: api/folders/unassigned-quizzes
    // Returns all quizzes not yet in a folder (for "Add Quiz" modal)
    // ─────────────────────────────────────────────
    [HttpGet("unassigned-quizzes")]
    public async Task<IActionResult> GetUnassignedQuizzes()
    {
        var teacherId = GetTeacherId();
        if (teacherId == null) return Unauthorized();

        var quizzes = await _context.Quizzes
            .Where(q => q.TeacherId == teacherId.Value)
            .OrderByDescending(q => q.CreatedAt)
            .Select(q => new
            {
                q.Id,
                q.Title,
                q.Status,
                q.FolderId,
                q.CreatedAt,
                QuestionCount = q.Questions.Count
            })
            .ToListAsync();

        return Ok(quizzes);
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    private Guid? GetTeacherId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (claim == null || !Guid.TryParse(claim.Value, out var id)) return null;
        return id;
    }

    private object MapFolderToDto(Folder folder, List<Folder> allFolders)
    {
        var subFolders = allFolders
            .Where(f => f.ParentFolderId == folder.Id)
            .Select(f => MapFolderToDto(f, allFolders))
            .ToList();

        return new
        {
            folder.Id,
            folder.Name,
            folder.TeacherId,
            folder.ParentFolderId,
            folder.Color,
            folder.Icon,
            folder.CreatedAt,
            folder.LastModifiedAt,
            SubFolders = subFolders,
            QuizCount = folder.Quizzes.Count,
            Quizzes = folder.Quizzes.Select(q => new
            {
                q.Id,
                q.Title,
                q.Description,
                q.QuizCode,
                q.Difficulty,
                q.TimeLimit,
                q.DefaultQuestionTimeSeconds,
                q.Status,
                q.Tags,
                q.CreatedAt,
                QuestionCount = q.Questions.Count
            }).ToList()
        };
    }
}

// ─────────────────────────────────────────────
// Request DTOs
// ─────────────────────────────────────────────
public class CreateFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}

public class UpdateFolderRequest
{
    public string? Name { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string? Color { get; set; }
    public string? Icon { get; set; }
}

public class AddQuizToFolderRequest
{
    public List<Guid> QuizIds { get; set; } = new();
}
