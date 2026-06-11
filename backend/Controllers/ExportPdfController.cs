using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; // ADD THIS

using backend.Data;
using backend.Models;

using PdfSharpCore.Drawing;
using PdfSharpCore.Pdf;

using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers;

[ApiController]
[Route("api/exports")]
[Authorize]
public class ExportPdfController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExportPdfController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET api/exports/quizzes/{quizId}/pdf
    [HttpGet("quizzes/{quizId:guid}/pdf")]
    public async Task<IActionResult> ExportQuizToPdf([FromRoute] Guid quizId)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return NotFound("Quiz not found.");

        var attempts = await _context.QuizAttempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId)
            .ToListAsync();

        // Create PDF document
        var document = new PdfDocument();
        var page = document.AddPage();
        page.Size = PdfSharpCore.PageSize.A4;
        var gfx = XGraphics.FromPdfPage(page);
        var font = new XFont("Arial", 12, XFontStyle.Regular);
        double y = 40;
        gfx.DrawString($"Quiz Report: {quiz.Title}", new XFont("Arial", 18, XFontStyle.Bold), XBrushes.Black, new XPoint(40, y));
        y += 30;
        // Overview section
        gfx.DrawString($"Total Participants: {attempts.Count}", font, XBrushes.Black, new XPoint(40, y));
        y += 20;
        // Add more sections as needed (summary stats, leaderboards, etc.)
        // For brevity, only basic info is added.

        using var stream = new MemoryStream();
        document.Save(stream, false);
        var fileBytes = stream.ToArray();
        var fileName = $"QuizReport_{quizId}_{DateTime.UtcNow:yyyyMMdd}.pdf";
        return File(fileBytes, "application/pdf", fileName);
    }
}
