// ExportController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using backend.Data;
using backend.Models;
using OfficeOpenXml;
using System.IO;

namespace backend.Controllers;

[ApiController]
[Route("api/quizzes")]
[Authorize]
public class ExportController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public ExportController(ApplicationDbContext context)
    {
        _context = context;
        // EPPlus requires setting the license context (non-commercial use).
        ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
    }

    // GET api/quizzes/{quizId}/export/excel
    [HttpGet("{quizId:guid}/export/excel")]
    public async Task<IActionResult> ExportQuizToExcel([FromRoute] Guid quizId)
    {
        // Load quiz with questions
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return NotFound("Quiz not found.");

        // Load attempts and answers
        var attempts = await _context.QuizAttempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId)
            .ToListAsync();

        var attemptIds = attempts.Select(a => a.Id).ToList();
        var answers = await _context.QuizAnswers
            .Where(ans => attemptIds.Contains(ans.AttemptId))
            .ToListAsync();

        using var package = new ExcelPackage();
        // ------------------- Overview sheet -------------------
        var overview = package.Workbook.Worksheets.Add("Overview");
        // Header row
        var headers = new List<string>
        {
            "Question",
            "Question Type",
            "Question Accuracy",
            "Avg Time (s)",
            "Correct",
            "Incorrect",
            "Graded",
            "Ungraded",
            "Un‑attempted"
        };
        // Append dynamic student name columns
        var studentNames = attempts.Select(a => a.Student?.Name ?? "Unknown").Distinct().ToList();
        headers.AddRange(studentNames);
        for (int i = 0; i < headers.Count; i++)
            overview.Cells[1, i + 1].Value = headers[i];

        // Populate per‑question rows
        int row = 2;
        foreach (var q in quiz.Questions.OrderBy(q => q.OrderIndex))
        {
            var qAnswers = answers.Where(a => a.QuestionId == q.Id).ToList();
            var correct = qAnswers.Count(a => a.IsCorrect);

var incorrect =
    qAnswers.Count(a => !a.IsCorrect);

var graded = qAnswers.Count;

var ungraded = 0;

var unattempted =
    attempts.Count - qAnswers.Count;
            var accuracy = qAnswers.Any() ? Math.Round((double)correct / qAnswers.Count * 100, 1) : 0;
            var avgTime = qAnswers.Any() ? Math.Round(qAnswers.Average(a => a.ResponseTimeMs) / 1000.0, 2) : 0;

            overview.Cells[row, 1].Value = q.QuestionText;
            overview.Cells[row, 2].Value = q.QuestionType;
            overview.Cells[row, 3].Value = accuracy;
            overview.Cells[row, 4].Value = avgTime;
            overview.Cells[row, 5].Value = correct;
            overview.Cells[row, 6].Value = incorrect;
            overview.Cells[row, 7].Value = graded;
            overview.Cells[row, 8].Value = ungraded;
            overview.Cells[row, 9].Value = unattempted;

            // Fill student‑wise columns with their score for this question (1 = correct, 0 = incorrect, empty = not attempted)
            for (int i = 0; i < studentNames.Count; i++)
            {
                var studentName = studentNames[i];
                var attempt = attempts.FirstOrDefault(a => (a.Student?.Name ?? "Unknown") == studentName);
                if (attempt == null) continue;
                var ans = qAnswers.FirstOrDefault(a => a.AttemptId == attempt.Id);
                if (ans == null)
                {
                    overview.Cells[row, 10 + i].Value = ""; // not attempted
                }
                else
                {
                    overview.Cells[row, 10 + i].Value = ans.IsCorrect ? 1 : 0;
                }
            }
            row++;
        }

        // ------------------- Participant Data sheet -------------------
        var participants = package.Workbook.Worksheets.Add("Participant Data");
        var pHeaders = new[] { "Student Name", "Score", "Percentage", "Accuracy", "Time (s)", "Passed" };
        for (int i = 0; i < pHeaders.Length; i++)
            participants.Cells[1, i + 1].Value = pHeaders[i];
        int pRow = 2;
        foreach (var att in attempts)
        {
            participants.Cells[pRow, 1].Value = att.Student?.Name ?? "Unknown";
            participants.Cells[pRow, 2].Value = att.Score;
            participants.Cells[pRow, 3].Value = Math.Round(att.Percentage, 1);
            participants.Cells[pRow, 4].Value = Math.Round(att.Accuracy, 1);
            participants.Cells[pRow, 5].Value = Math.Round(att.TimeTakenMilliseconds / 1000.0, 2);
            participants.Cells[pRow, 6].Value = att.Percentage >= (att.PassMark > 0 ? att.PassMark : 60);
            pRow++;
        }

        // ------------------- Time Data sheet -------------------
        var timeSheet = package.Workbook.Worksheets.Add("Time Data");
        var tHeaders = new[] { "Student Name", "Question", "Response Time (s)" };
        for (int i = 0; i < tHeaders.Length; i++)
            timeSheet.Cells[1, i + 1].Value = tHeaders[i];
        int tRow = 2;
        foreach (var ans in answers)
        {
            var studentName = attempts.FirstOrDefault(a => a.Id == ans.AttemptId)?.Student?.Name ?? "Unknown";
            var questionText = quiz.Questions.FirstOrDefault(q => q.Id == ans.QuestionId)?.QuestionText ?? "";
            timeSheet.Cells[tRow, 1].Value = studentName;
            timeSheet.Cells[tRow, 2].Value = questionText;
            timeSheet.Cells[tRow, 3].Value = Math.Round(ans.ResponseTimeMs / 1000.0, 2);
            tRow++;
        }

        // ------------------- Quiz Details sheet -------------------
        var details = package.Workbook.Worksheets.Add("Quiz Details");
        var dHeaders = new[] { "Student Name", "Question", "Selected Answer", "Correct Answer", "Is Correct", "Response Time (s)" };
        for (int i = 0; i < dHeaders.Length; i++)
            details.Cells[1, i + 1].Value = dHeaders[i];
        int dRow = 2;
        foreach (var ans in answers)
        {
            var studentName = attempts.FirstOrDefault(a => a.Id == ans.AttemptId)?.Student?.Name ?? "Unknown";
            var question = quiz.Questions.FirstOrDefault(q => q.Id == ans.QuestionId);
            if (question == null) continue;
            details.Cells[dRow, 1].Value = studentName;
            details.Cells[dRow, 2].Value = question.QuestionText;
            details.Cells[dRow, 3].Value = ans.SelectedAnswer ?? "";
            details.Cells[dRow, 4].Value = question.CorrectAnswer;
            details.Cells[dRow, 5].Value = ans.IsCorrect;
            details.Cells[dRow, 6].Value = Math.Round(ans.ResponseTimeMs / 1000.0, 2);
            dRow++;
        }

        // Prepare file for download
        var fileBytes = package.GetAsByteArray();
        var fileName = $"QuizResults_{quizId}_{DateTime.UtcNow:yyyyMMdd}.xlsx";
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }
}
