using Microsoft.AspNetCore.Mvc;
using backend.FileProcessing;
using backend.DTOs;
using backend.Data;
using backend.Models;
using backend.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AIController : ControllerBase
{
    private readonly QuizGenerationService _quizGenerationService;
    private readonly ApplicationDbContext _context;

    public AIController(
        QuizGenerationService quizGenerationService,
        ApplicationDbContext context
    )
    {
        _quizGenerationService = quizGenerationService;
        _context = context;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        try
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            var uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Uploads"
            );

            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName =
                $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var filePath =
                Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(
                filePath,
                FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            string extractedText = "";

            var extension =
                Path.GetExtension(file.FileName)
                    .ToLowerInvariant();

            switch (extension)
            {
                case ".pdf":
                    extractedText =
                        PdfExtractor.Extract(filePath);
                    break;

                case ".docx":
                    extractedText =
                        DocxExtractor.Extract(filePath);
                    break;

                case ".pptx":
                    extractedText =
                        PptxExtractor.Extract(filePath);
                    break;

                case ".txt":
                    extractedText =
                        await System.IO.File.ReadAllTextAsync(filePath);
                    break;

                default:
                    return BadRequest(
                        "Unsupported file type."
                    );
            }

            return Ok(new
            {
                FileName = file.FileName,
                TextLength = extractedText.Length,
                ExtractedText = extractedText
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Error = ex.Message,
                StackTrace = ex.StackTrace
            });
        }
    }

    [HttpPost("generate")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> GenerateQuiz([FromForm] GenerateQuizRequest request)
    {
        try
        {
            Console.WriteLine("=== PARSE QUIZ HIT ===");

            var file = request.File;

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (extension != ".json" && extension != ".txt" && extension != ".pdf" && extension != ".docx" && extension != ".pptx")
            {
                return BadRequest("Unsupported file type. Please upload a .json, .txt, .pdf, .docx, or .pptx file.");
            }

            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "Uploads");
            Directory.CreateDirectory(uploadsFolder);

            var uniqueFileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var result = await _quizGenerationService.ProcessFileAsync(filePath, extension);

            Console.WriteLine($"Parsed {result.Count} questions successfully");

            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());

            return StatusCode(500, new
            {
                Error = ex.Message,
                StackTrace = ex.StackTrace
            });
        }
    }

    [HttpGet("analytics/{quizId}")]
    public async Task<IActionResult> GetQuizAnalytics(Guid quizId, [FromQuery] Guid? sessionId = null)
    {
        try
        {
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

            var attempts = await query.ToListAsync();

            if (!attempts.Any())
            {
                return Ok(new
                {
                    HasData = false,
                    Message = "No attempts recorded for this quiz yet."
                });
            }

            var quiz = await _context.Quizzes
                .Include(q => q.Questions)
                .FirstOrDefaultAsync(q => q.Id == quizId);

            if (quiz == null)
            {
                return NotFound("Quiz not found");
            }

            var answers = await _context.QuizAnswers
                .Where(a => _context.QuizAttempts.Any(at => at.Id == a.AttemptId && at.QuizId == quizId))
                .ToListAsync();

            int totalAttempts = attempts.Count;
            double avgScore = attempts.Average(a => a.Score);
            double avgPercentage = attempts.Average(a => a.Percentage);
            double highestScore = attempts.Max(a => a.Score);

            var questionStats = quiz.Questions.Select(q =>
            {
                var qAnswers = answers.Where(a => a.QuestionId == q.Id).ToList();
                int totalAnswers = qAnswers.Count;
                int correctAnswers = qAnswers.Count(a => a.IsCorrect);
                double correctRate = totalAnswers == 0 ? 0 : ((double)correctAnswers / totalAnswers) * 100;

                return new
                {
                    q.QuestionText,
                    q.CorrectAnswer,
                    TotalAttempts = totalAnswers,
                    CorrectAttempts = correctAnswers,
                    CorrectRate = correctRate
                };
            }).OrderBy(q => q.CorrectRate).ToList();

            // We removed Gemini, so we just return the raw stats without AI insights
            var insightsText = "AI Insights have been disabled as per offline mode requirements. Review the question performance below.";

            return Ok(new
            {
                HasData = true,
                Insights = insightsText,
                AveragePercentage = avgPercentage,
                TotalAttempts = totalAttempts,
                HighestScore = highestScore
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }

    [HttpPost("save-quiz")]
    public async Task<IActionResult> SaveQuiz(
        SaveGeneratedQuizDto dto
    )
    {
        try
        {
            var quiz = new Quiz
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                Difficulty = dto.Difficulty,
                TimeLimit = dto.TimeLimit,
                Status = "Draft",
                QuizCode = "",
                TeacherId = dto.TeacherId
            };

            _context.Quizzes.Add(quiz);

            foreach (var q in dto.Questions)
            {
                if (
                    q.Options == null ||
                    q.Options.Count < 4
                )
                {
                    return BadRequest(
                        "Each question must contain 4 options."
                    );
                }

                var question = new Question
                {
                    Id = Guid.NewGuid(),
                    QuizId = quiz.Id,
                    QuestionText = q.Question,
                    OptionA = q.Options[0],
                    OptionB = q.Options[1],
                    OptionC = q.Options[2],
                    OptionD = q.Options[3],
                    CorrectAnswer = q.CorrectAnswer,
                    Explanation = q.Explanation,
                    QuestionType = "MCQ"
                };

                _context.Questions.Add(question);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Quiz saved successfully",
                QuizId = quiz.Id
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                Error = ex.Message,
                StackTrace = ex.StackTrace
            });
        }
    }
}