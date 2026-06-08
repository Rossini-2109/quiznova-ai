using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.IO;
using System;

using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;

namespace backend.Services;

public class QuizImportService : IQuizImportService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IWebHostEnvironment _env;

    public QuizImportService(ApplicationDbContext dbContext, IWebHostEnvironment env)
    {
        _dbContext = dbContext;
        _env = env;
    }

    public async Task<Guid> ImportQuizAsync(IFormFile file, Guid teacherId)
    {
        // Save uploaded file to the Uploads folder
        var uploadsRoot = Path.Combine(_env.ContentRootPath, "Uploads");
        var filePath = Path.Combine(uploadsRoot, Guid.NewGuid().ToString() + Path.GetExtension(file.FileName));
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Parse the file based on its extension
        var questions = await ParseFileAsync(filePath);

        // Create the quiz entity
        var quiz = new Quiz
        {
            Title = Path.GetFileNameWithoutExtension(file.FileName),
            Description = "Imported quiz generated from uploaded file.",
            TeacherId = teacherId,
            QuizCode = new Random().Next(100000, 999999).ToString(),
            Status = "Draft",
            CreatedAt = DateTime.UtcNow,
            Questions = questions
        };

        _dbContext.Quizzes.Add(quiz);
        await _dbContext.SaveChangesAsync();

        return quiz.Id;
    }

    private async Task<List<Question>> ParseFileAsync(string filePath)
    {
        var ext = Path.GetExtension(filePath).ToLowerInvariant();
        string rawText = string.Empty;
        switch (ext)
        {
            case ".pdf":
                rawText = await ExtractTextFromPdfAsync(filePath);
                break;
            case ".docx":
                rawText = await ExtractTextFromDocxAsync(filePath);
                break;
            case ".txt":
                rawText = await File.ReadAllTextAsync(filePath);
                break;
            default:
                throw new NotSupportedException($"File type {ext} is not supported for quiz import.");
        }

        return BuildQuestionsFromRawText(rawText);
    }

    private async Task<string> ExtractTextFromPdfAsync(string path)
    {
        // Using UglyToad.PdfPig for simple text extraction
        return await Task.Run(() =>
        {
            using var pdf = UglyToad.PdfPig.PdfDocument.Open(path);
            var text = new System.Text.StringBuilder();
            foreach (var page in pdf.GetPages())
            {
                text.AppendLine(page.Text);
            }
            return text.ToString();
        });
    }

    private async Task<string> ExtractTextFromDocxAsync(string path)
    {
        return await Task.Run(() =>
        {
            using var wordDoc = WordprocessingDocument.Open(path, false);
            var body = wordDoc.MainDocumentPart?.Document?.Body;
            return body?.InnerText ?? string.Empty;
        });
    }

    private List<Question> BuildQuestionsFromRawText(string raw)
    {
        // Very simple heuristic: each question block is separated by two newlines.
        // Within a block, we expect lines starting with Q:, A:, B:, C:, D:, Answer:
        var blocks = raw.Split(new[] { "\r\n\r\n", "\n\n" }, StringSplitOptions.RemoveEmptyEntries);
        var result = new List<Question>();
        foreach (var block in blocks)
        {
            var lines = block.Split(new[] { "\r\n", "\n" }, StringSplitOptions.RemoveEmptyEntries);
            var q = new Question();
            foreach (var line in lines)
            {
                var trimmed = line.Trim();
                if (trimmed.StartsWith("Q:", StringComparison.OrdinalIgnoreCase))
                    q.QuestionText = trimmed.Substring(2).Trim();
                else if (trimmed.StartsWith("A:", StringComparison.OrdinalIgnoreCase))
                    q.OptionA = trimmed.Substring(2).Trim();
                else if (trimmed.StartsWith("B:", StringComparison.OrdinalIgnoreCase))
                    q.OptionB = trimmed.Substring(2).Trim();
                else if (trimmed.StartsWith("C:", StringComparison.OrdinalIgnoreCase))
                    q.OptionC = trimmed.Substring(2).Trim();
                else if (trimmed.StartsWith("D:", StringComparison.OrdinalIgnoreCase))
                    q.OptionD = trimmed.Substring(2).Trim();
                else if (trimmed.StartsWith("Answer:", StringComparison.OrdinalIgnoreCase))
                    q.CorrectAnswer = trimmed.Substring(7).Trim();
                else if (trimmed.StartsWith("Explanation:", StringComparison.OrdinalIgnoreCase))
                    q.Explanation = trimmed.Substring(12).Trim();
            }
            // Basic validation – ensure at least question text and one option exist
            if (!string.IsNullOrWhiteSpace(q.QuestionText) && !string.IsNullOrWhiteSpace(q.OptionA))
            {
                q.QuestionType = "MCQ";
                result.Add(q);
            }
        }
        return result;
    }
}
