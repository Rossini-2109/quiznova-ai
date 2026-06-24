using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using backend.Data;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExportExcelController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExportExcelController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("quiz/{quizId}")]
    public async Task<IActionResult> ExportQuizReport(Guid quizId, [FromQuery] Guid? sessionId = null)
    {
        var quiz = await _context.Quizzes
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return NotFound("Quiz not found");
        }

        var query = _context.QuizAttempts
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

        var attempts = await query
            .OrderByDescending(a => a.Score)
            .ToListAsync();

        using var workbook = new XLWorkbook();

        var worksheet = workbook.Worksheets.Add("Quiz Report");

        worksheet.Cell(1, 1).Value = "Quiz Title";
        worksheet.Cell(1, 2).Value = "Student Id";
        worksheet.Cell(1, 3).Value = "Employee Id";
        worksheet.Cell(1, 4).Value = "Score";
        worksheet.Cell(1, 5).Value = "Correct Answers";
        worksheet.Cell(1, 6).Value = "Wrong Answers";
        worksheet.Cell(1, 7).Value = "Skipped Questions";
        worksheet.Cell(1, 8).Value = "Percentage";
        worksheet.Cell(1, 9).Value = "Accuracy";
        worksheet.Cell(1, 10).Value = "Time Taken (Sec)";
        worksheet.Cell(1, 11).Value = "Rank";
        worksheet.Cell(1, 12).Value = "Started At";
        worksheet.Cell(1, 13).Value = "Submitted At";

        int row = 2;

        foreach (var attempt in attempts)
        {
            worksheet.Cell(row, 1).Value = quiz.Title;
            worksheet.Cell(row, 2).Value = attempt.StudentId.ToString();
            worksheet.Cell(row, 3).Value = attempt.EmployeeId;
            worksheet.Cell(row, 4).Value = attempt.Score;
            worksheet.Cell(row, 5).Value = attempt.CorrectAnswers;
            worksheet.Cell(row, 6).Value = attempt.WrongAnswers;
            worksheet.Cell(row, 7).Value = attempt.SkippedQuestions;
            worksheet.Cell(row, 8).Value = attempt.Percentage;
            worksheet.Cell(row, 9).Value = attempt.Accuracy;
            worksheet.Cell(row, 10).Value = attempt.TimeTakenSeconds;
            worksheet.Cell(row, 11).Value = attempt.Rank;
            worksheet.Cell(row, 12).Value = attempt.StartedAt;
            worksheet.Cell(row, 13).Value = attempt.SubmittedAt;

            row++;
        }
        using var stream = new MemoryStream();

      workbook.SaveAs(stream);

var content = stream.ToArray();

// Set attachment header with appropriate filename
Response.Headers["Content-Disposition"] = $"attachment; filename=\"{quiz.Title}_results.xlsx\"";

return File(
    content,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    $"{quiz.Title}_results.xlsx"
);