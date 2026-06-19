using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Data;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/analytics")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public AnalyticsController(ApplicationDbContext context)
    {
        _context = context;
    }

    // ─────────────────────────────────────────────
    // GET api/analytics/quiz/{quizId}
    // Full quiz summary dashboard
    // ─────────────────────────────────────────────
    [HttpGet("quiz/{quizId:guid}")]
    public async Task<IActionResult> GetQuizAnalytics([FromRoute] Guid quizId, [FromQuery] Guid? sessionId = null)
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

        if (!attempts.Any())
        {
            return Ok(new
            {
                QuizId = quizId,
                QuizTitle = quiz.Title,
                TotalQuestions = quiz.Questions.Count,
                TotalParticipants = 0,
                TotalAttempts = 0,
                AverageScore = 0,
                HighestScore = 0,
                LowestScore = 0,
                AverageAccuracy = 0,
                AveragePercentage = 0,
                CompletionRate = 0,
                PassCount = 0,
                FailCount = 0,
                PassRate = 0,
                AverageTimeSecs = 0,
                FastestTimeSecs = 0,
                SlowestTimeSecs = 0
            });
        }

        var passedAttempts = attempts.Where(a => a.PassMark > 0
            ? a.Percentage >= a.PassMark
            : a.Percentage >= 60).ToList();

        return Ok(new
        {
            QuizId = quizId,
            QuizTitle = quiz.Title,
            TotalQuestions = quiz.Questions.Count,
            TotalParticipants = attempts.Select(a => a.StudentId).Distinct().Count(),
            TotalAttempts = attempts.Count,
            AverageScore = Math.Round(attempts.Average(a => a.Score), 2),
            HighestScore = attempts.Max(a => a.Score),
            LowestScore = attempts.Min(a => a.Score),
            AverageAccuracy = Math.Round(attempts.Where(a => a.Accuracy > 0).Select(a => a.Accuracy).DefaultIfEmpty(0).Average(), 1),
            AveragePercentage = Math.Round(attempts.Average(a => a.Percentage), 1),
            CompletionRate = Math.Round((double)attempts.Count(a => a.CompletionStatus == "Completed") / attempts.Count * 100, 1),
            PassCount = passedAttempts.Count,
            FailCount = attempts.Count - passedAttempts.Count,
            PassRate = Math.Round((double)passedAttempts.Count / attempts.Count * 100, 1),
            AverageTimeSecs = (int)attempts.Average(a => a.TimeTakenMilliseconds / 1000),
            FastestTimeSecs = attempts.Min(a => a.TimeTakenMilliseconds / 1000),
            SlowestTimeSecs = attempts.Max(a => a.TimeTakenMilliseconds / 1000)
        });
    }

    // ─────────────────────────────────────────────
    // GET api/analytics/quiz/{quizId}/leaderboard
    // Ranked list: highest marks → fastest time → highest accuracy
    // ─────────────────────────────────────────────
    [HttpGet("quiz/{quizId:guid}/leaderboard")]
    public async Task<IActionResult> GetLeaderboard([FromRoute] Guid quizId, [FromQuery] Guid? sessionId = null)
    {
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

        if (!attempts.Any()) return Ok(new List<object>());

        var ranked = attempts
            .OrderByDescending(a => a.Score)
            .ThenBy(a => a.TimeTakenMilliseconds)
            .ThenByDescending(a => a.Accuracy)
            .Select((a, index) => new
            {
                Rank = index + 1,
                AttemptId = a.Id,
                StudentId = a.StudentId,
                StudentName = a.Student?.Name ?? "Unknown",
                Score = a.Score,
                TotalQuestions = a.TotalQuestions,
                CorrectAnswers = a.CorrectAnswers,
                WrongAnswers = a.WrongAnswers,
                SkippedQuestions = a.SkippedQuestions,
                Percentage = Math.Round(a.Percentage, 1),
                Accuracy = Math.Round(a.Accuracy, 1),
                TimeTakenMs = a.TimeTakenMilliseconds,
                TimeTakenSecs = a.TimeTakenMilliseconds / 1000,
                CompletionStatus = a.CompletionStatus,
                SubmittedAt = a.SubmittedAt,
                IsPassed = a.Percentage >= (a.PassMark > 0 ? a.PassMark : 60)
            })
            .ToList();

        return Ok(ranked);
    }

    // ─────────────────────────────────────────────
    // GET api/analytics/quiz/{quizId}/heatmap
    // Student × Question performance matrix
    // ─────────────────────────────────────────────
    [HttpGet("quiz/{quizId:guid}/heatmap")]
    public async Task<IActionResult> GetHeatmap([FromRoute] Guid quizId, [FromQuery] Guid? sessionId = null)
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

        if (!attempts.Any()) return Ok(new { questions = new List<object>(), students = new List<object>() });

        var attemptIds = attempts.Select(a => a.Id).ToList();
        var answers = await _context.QuizAnswers
            .Where(ans => attemptIds.Contains(ans.AttemptId))
            .ToListAsync();

        var questions = quiz.Questions.OrderBy(q => q.OrderIndex).ToList();

        // Per-question accuracy for difficulty classification
        var questionStats = questions.Select((q, qIndex) =>
        {
            var qAnswers = answers.Where(a => a.QuestionId == q.Id).ToList();
            var correctCount = qAnswers.Count(a => a.IsCorrect);
            var accuracy = qAnswers.Any() ? Math.Round((double)correctCount / qAnswers.Count * 100, 1) : 0;
            var difficulty = accuracy > 80 ? "Easy" : accuracy > 50 ? "Medium" : "Hard";
            return new
            {
                QuestionId = q.Id,
                QuestionText = q.QuestionText.Length > 60
                    ? q.QuestionText[..60] + "..." : q.QuestionText,
                QuestionType = q.QuestionType,
                CorrectAnswer = q.CorrectAnswer,
                TotalAttempts = qAnswers.Count,
                CorrectCount = correctCount,
                WrongCount = qAnswers.Count - correctCount,
                SkippedCount = attempts.Count - qAnswers.Count,
                Accuracy = accuracy,
                Difficulty = difficulty,
                AverageResponseMs = qAnswers.Any() ? (int)qAnswers.Average(a => a.ResponseTimeMs) : 0,
                Label = $"Q{qIndex + 1}"
            };
        }).ToList();

        // Per-student row
        var studentRows = attempts
            .OrderByDescending(a => a.Score)
            .ThenBy(a => a.TimeTakenMilliseconds)
            .Select((attempt, idx) =>
            {
                var studentAnswers = answers.Where(a => a.AttemptId == attempt.Id).ToList();
                var cells = questions.Select(q =>
                {
                    var answer = studentAnswers.FirstOrDefault(a => a.QuestionId == q.Id);
                    return new
                    {
                        QuestionId = q.Id,
                        Status = answer == null ? "skipped" : answer.IsCorrect ? "correct" : "wrong",
                        SelectedAnswer = answer?.SelectedAnswer ?? "",
                        CorrectAnswer = q.CorrectAnswer
                    };
                }).ToList();

                return new
                {
                    Rank = idx + 1,
                    AttemptId = attempt.Id,
                    StudentId = attempt.StudentId,
                    StudentName = attempt.Student?.Name ?? "Unknown",
                    Score = attempt.Score,
                    Percentage = Math.Round(attempt.Percentage, 1),
                    TimeTakenSecs = attempt.TimeTakenMilliseconds / 1000,
                    Cells = cells
                };
            }).ToList();

        return Ok(new { Questions = questionStats, Students = studentRows });
    }

    // ─────────────────────────────────────────────
    // GET api/analytics/quiz/{quizId}/questions
    // Per-question detailed analytics
    // ─────────────────────────────────────────────
    [HttpGet("quiz/{quizId:guid}/questions")]
    public async Task<IActionResult> GetQuestionAnalytics([FromRoute] Guid quizId, [FromQuery] Guid? sessionId = null)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) return NotFound("Quiz not found.");

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

        var attemptIds = attempts.Select(a => a.Id).ToList();
        var answers = await _context.QuizAnswers
            .Where(ans => attemptIds.Contains(ans.AttemptId))
            .ToListAsync();

        var result = quiz.Questions.OrderBy(q => q.OrderIndex).Select(q =>
        {
            var qAnswers = answers.Where(a => a.QuestionId == q.Id).ToList();
            var correct = qAnswers.Count(a => a.IsCorrect);
            var wrong = qAnswers.Count(a => !a.IsCorrect);
            var skipped = attempts.Count - qAnswers.Count;
            var accuracy = qAnswers.Any() ? Math.Round((double)correct / qAnswers.Count * 100, 1) : 0;
            var difficulty = accuracy > 80 ? "Easy" : accuracy > 50 ? "Medium" : "Hard";

            return new
            {
                QuestionId = q.Id,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                CorrectAnswer = q.CorrectAnswer,
                Explanation = q.Explanation,
                TotalAttempts = qAnswers.Count,
                CorrectCount = correct,
                WrongCount = wrong,
                SkippedCount = skipped,
                AccuracyRate = accuracy,
                Difficulty = difficulty,
                AverageResponseMs = qAnswers.Any() ? (int)qAnswers.Average(a => a.ResponseTimeMs) : 0
            };
        }).ToList();

        return Ok(result);
    }

    // ─────────────────────────────────────────────
    // GET api/analytics/quiz/{quizId}/student/{studentId}
    // Individual student detailed report
    // ─────────────────────────────────────────────
    [HttpGet("quiz/{quizId:guid}/student/{studentId:guid}")]
    public async Task<IActionResult> GetStudentReport([FromRoute] Guid quizId, [FromRoute] Guid studentId, [FromQuery] Guid? sessionId = null)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null) return NotFound("Quiz not found.");

        var attemptQuery = _context.QuizAttempts
            .Include(a => a.Student)
            .Where(a => a.QuizId == quizId && a.StudentId == studentId);

        if (sessionId.HasValue)
        {
            if (sessionId.Value == Guid.Empty)
            {
                attemptQuery = attemptQuery.Where(a => a.SessionId == null);
            }
            else
            {
                attemptQuery = attemptQuery.Where(a => a.SessionId == sessionId.Value);
            }
        }

        var attempt = await attemptQuery.FirstOrDefaultAsync();

        if (attempt == null) return NotFound("No attempt found for this student.");

        // Rank calculation
        var allAttemptsQuery = _context.QuizAttempts
            .Where(a => a.QuizId == quizId);

        if (sessionId.HasValue)
        {
            if (sessionId.Value == Guid.Empty)
            {
                allAttemptsQuery = allAttemptsQuery.Where(a => a.SessionId == null);
            }
            else
            {
                allAttemptsQuery = allAttemptsQuery.Where(a => a.SessionId == sessionId.Value);
            }
        }

        var allAttempts = await allAttemptsQuery
            .OrderByDescending(a => a.Score)
            .ThenBy(a => a.TimeTakenMilliseconds)
            .ThenByDescending(a => a.Accuracy)
            .ToListAsync();

        var rank = allAttempts.FindIndex(a => a.Id == attempt.Id) + 1;

        var answers = await _context.QuizAnswers
            .Where(a => a.AttemptId == attempt.Id)
            .ToListAsync();

        var questionReview = quiz.Questions.OrderBy(q => q.OrderIndex).Select(q =>
        {
            var ans = answers.FirstOrDefault(a => a.QuestionId == q.Id);
            return new
            {
                QuestionId = q.Id,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectAnswer = q.CorrectAnswer,
                Explanation = q.Explanation,
                SelectedAnswer = ans?.SelectedAnswer ?? null,
                IsCorrect = ans?.IsCorrect ?? false,
                Status = ans == null ? "skipped" : ans.IsCorrect ? "correct" : "wrong",
                ResponseTimeMs = ans?.ResponseTimeMs ?? 0
            };
        }).ToList();

        var correctQuestions = questionReview.Where(q => q.Status == "correct").ToList();
        var wrongQuestions = questionReview.Where(q => q.Status == "wrong").ToList();

        return Ok(new
        {
            Rank = rank,
            TotalParticipants = allAttempts.Count,
            AttemptId = attempt.Id,
            StudentId = attempt.StudentId,
            StudentName = attempt.Student?.Name ?? "Unknown",
            Score = attempt.Score,
            TotalQuestions = attempt.TotalQuestions,
            CorrectAnswers = attempt.CorrectAnswers,
            WrongAnswers = attempt.WrongAnswers,
            SkippedQuestions = attempt.SkippedQuestions,
            Percentage = Math.Round(attempt.Percentage, 1),
            Accuracy = Math.Round(attempt.Accuracy, 1),
            TimeTakenMs = attempt.TimeTakenMilliseconds,
            TimeTakenSecs = attempt.TimeTakenMilliseconds / 1000,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            CompletionStatus = attempt.CompletionStatus,
            IsPassed = attempt.Percentage >= (attempt.PassMark > 0 ? attempt.PassMark : 60),
            QuestionReview = questionReview,
            StrengthAreas = correctQuestions.Take(3).Select(q => q.QuestionText.Length > 80
                ? q.QuestionText[..80] + "..." : q.QuestionText).ToList(),
            WeakAreas = wrongQuestions.Take(3).Select(q => q.QuestionText.Length > 80
                ? q.QuestionText[..80] + "..." : q.QuestionText).ToList()
        });
    }
}
