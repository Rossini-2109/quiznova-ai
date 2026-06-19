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
    [AllowAnonymous]
    public async Task<IActionResult> ExportQuizToPdf([FromRoute] Guid quizId, [FromQuery] Guid? sessionId = null)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return NotFound("Quiz not found.");

        var query = _context.QuizAttempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId);

        if (sessionId.HasValue)
        {
            if (sessionId.Value == Guid.Empty)
            {
                query = query.Where(a => a.SessionId == null);
            }
            else
            {
                query = query.Where(a => a.SessionId == sessionId.Value);
            }
        }

        var attempts = await query.ToListAsync();

        // Create PDF document
        var document = new PdfDocument();
        var page = document.AddPage();
        page.Size = PdfSharpCore.PageSize.A4;
        var gfx = XGraphics.FromPdfPage(page);
        
        var titleFont = new XFont("Arial", 18, XFontStyle.Bold);
        var headerFont = new XFont("Arial", 10, XFontStyle.Bold);
        var bodyFont = new XFont("Arial", 9, XFontStyle.Regular);
        
        double y = 40;
        gfx.DrawString($"Quiz Report: {quiz.Title}", titleFont, XBrushes.Black, new XPoint(40, y));
        y += 25;
        
        gfx.DrawString($"Total Questions: {quiz.Questions.Count}", bodyFont, XBrushes.Black, new XPoint(40, y));
        y += 15;
        gfx.DrawString($"Total Participants: {attempts.Count}", bodyFont, XBrushes.Black, new XPoint(40, y));
        y += 30;

        if (attempts.Count > 0)
        {
            // Table Header
            gfx.DrawString("Rank", headerFont, XBrushes.Black, new XPoint(40, y));
            gfx.DrawString("Student Name", headerFont, XBrushes.Black, new XPoint(80, y));
            gfx.DrawString("Employee ID", headerFont, XBrushes.Black, new XPoint(220, y));
            gfx.DrawString("Score", headerFont, XBrushes.Black, new XPoint(320, y));
            gfx.DrawString("Accuracy", headerFont, XBrushes.Black, new XPoint(380, y));
            gfx.DrawString("Time Taken", headerFont, XBrushes.Black, new XPoint(450, y));
            
            y += 15;
            gfx.DrawLine(XPens.Gray, 40, y, 550, y);
            y += 20;

            int rank = 1;
            foreach (var att in attempts.OrderBy(a => a.Rank).ThenByDescending(a => a.Score))
            {
                if (y > 780)
                {
                    page = document.AddPage();
                    page.Size = PdfSharpCore.PageSize.A4;
                    gfx = XGraphics.FromPdfPage(page);
                    y = 40;
                    
                    // Repeat headers on new page
                    gfx.DrawString("Rank", headerFont, XBrushes.Black, new XPoint(40, y));
                    gfx.DrawString("Student Name", headerFont, XBrushes.Black, new XPoint(80, y));
                    gfx.DrawString("Employee ID", headerFont, XBrushes.Black, new XPoint(220, y));
                    gfx.DrawString("Score", headerFont, XBrushes.Black, new XPoint(320, y));
                    gfx.DrawString("Accuracy", headerFont, XBrushes.Black, new XPoint(380, y));
                    gfx.DrawString("Time Taken", headerFont, XBrushes.Black, new XPoint(450, y));
                    
                    y += 15;
                    gfx.DrawLine(XPens.Gray, 40, y, 550, y);
                    y += 20;
                }

                gfx.DrawString(rank.ToString(), bodyFont, XBrushes.Black, new XPoint(40, y));
                gfx.DrawString(att.Student?.Name ?? "Unknown", bodyFont, XBrushes.Black, new XPoint(80, y));
                gfx.DrawString(att.EmployeeId ?? "—", bodyFont, XBrushes.Black, new XPoint(220, y));
                gfx.DrawString(att.Score.ToString(), bodyFont, XBrushes.Black, new XPoint(320, y));
                gfx.DrawString($"{att.Accuracy:F0}%", bodyFont, XBrushes.Black, new XPoint(380, y));
                gfx.DrawString($"{att.TimeTakenSeconds}s", bodyFont, XBrushes.Black, new XPoint(450, y));
                
                y += 20;
                rank++;
            }
        }
        else
        {
            gfx.DrawString("No submissions recorded for this quiz.", bodyFont, XBrushes.DarkRed, new XPoint(40, y));
        }

        using var stream = new MemoryStream();
        document.Save(stream, false);
        var fileBytes = stream.ToArray();
        var fileName = $"QuizReport_{quizId}_{DateTime.UtcNow:yyyyMMdd}.pdf";
        return File(fileBytes, "application/pdf", fileName);
    }
}
