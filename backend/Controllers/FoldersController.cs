using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
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

    // GET: api/folders
    [HttpGet]
    public async Task<IActionResult> GetFolders()
    {
        var teacherIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (teacherIdClaim == null || !Guid.TryParse(teacherIdClaim.Value, out var teacherId))
        {
            return Unauthorized();
        }

        // Fetch all folders for this teacher. We assemble them into a tree structure.
        var allFolders = await _context.Folders
            .Where(f => f.TeacherId == teacherId)
            .Include(f => f.Quizzes)
            .ToListAsync();

        // Return root folders (those with no parent)
        var rootFolders = allFolders
            .Where(f => f.ParentFolderId == null)
            .Select(f => MapFolderToDto(f, allFolders))
            .ToList();

        return Ok(rootFolders);
    }

    // POST: api/folders
    [HttpPost]
    public async Task<IActionResult> CreateFolder([FromBody] CreateFolderRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Folder name is required.");
        }

        var teacherIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (teacherIdClaim == null || !Guid.TryParse(teacherIdClaim.Value, out var teacherId))
        {
            return Unauthorized();
        }

        // If parent folder is provided, make sure it exists and belongs to this teacher
        if (request.ParentFolderId.HasValue)
        {
            var parentExists = await _context.Folders
                .AnyAsync(f => f.Id == request.ParentFolderId.Value && f.TeacherId == teacherId);
            if (!parentExists)
            {
                return BadRequest("Parent folder not found.");
            }
        }

        var folder = new Folder
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            TeacherId = teacherId,
            ParentFolderId = request.ParentFolderId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Folders.Add(folder);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFolders), null, folder);
    }

    // PUT: api/folders/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateFolder(Guid id, [FromBody] UpdateFolderRequest request)
    {
        var teacherIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (teacherIdClaim == null || !Guid.TryParse(teacherIdClaim.Value, out var teacherId))
        {
            return Unauthorized();
        }

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId);

        if (folder == null)
        {
            return NotFound("Folder not found.");
        }

        if (!string.IsNullOrWhiteSpace(request.Name))
        {
            folder.Name = request.Name.Trim();
        }

        if (request.ParentFolderId != null)
        {
            if (request.ParentFolderId == Guid.Empty)
            {
                folder.ParentFolderId = null; // Move to root
            }
            else
            {
                // Prevent cycle reference (cannot move to self)
                if (request.ParentFolderId == id)
                {
                    return BadRequest("A folder cannot be its own parent.");
                }

                // Verify parent exists
                var parentExists = await _context.Folders
                    .AnyAsync(f => f.Id == request.ParentFolderId && f.TeacherId == teacherId);
                if (!parentExists)
                {
                    return BadRequest("Parent folder not found.");
                }

                folder.ParentFolderId = request.ParentFolderId;
            }
        }

        await _context.SaveChangesAsync();
        return Ok(folder);
    }

    // DELETE: api/folders/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteFolder(Guid id)
    {
        var teacherIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (teacherIdClaim == null || !Guid.TryParse(teacherIdClaim.Value, out var teacherId))
        {
            return Unauthorized();
        }

        var folder = await _context.Folders
            .FirstOrDefaultAsync(f => f.Id == id && f.TeacherId == teacherId);

        if (folder == null)
        {
            return NotFound("Folder not found.");
        }

        // EF Core maps Cascade delete on Folder's SubFolders by default, but let's make sure
        // quizzes folder references are cleared (they will be set to null due to SetNull configuration)
        _context.Folders.Remove(folder);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Folder deleted successfully." });
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
            folder.CreatedAt,
            SubFolders = subFolders,
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
                q.CreatedAt,
                QuestionCount = q.Questions.Count
            }).ToList()
        };
    }
}

public class CreateFolderRequest
{
    public string Name { get; set; } = string.Empty;
    public Guid? ParentFolderId { get; set; }
}

public class UpdateFolderRequest
{
    public string? Name { get; set; }
    public Guid? ParentFolderId { get; set; }
}
