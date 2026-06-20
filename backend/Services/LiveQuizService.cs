using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Helpers;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class LiveQuizService : ILiveQuizService
{
    private readonly ApplicationDbContext _context;
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<Guid, int> _participantQuestions = new();
    // Per-participant shuffled question order for quizzes with ShuffleQuestions enabled
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<(Guid SessionId, Guid ParticipantId), List<Guid>> _shuffledQuestionOrders = new();

    public LiveQuizService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Session> GetSessionAsync(string sessionCode)
    {
        return await _context.Sessions
            .Include(s => s.Quiz)
            .ThenInclude(q => q.Questions)
            .FirstOrDefaultAsync(s => s.SessionCode == sessionCode)
            ?? null;
    }

    public async Task<Session> CreateSessionAsync(Guid quizId, Guid teacherId)
    {
        var quiz = await _context.Quizzes.FindAsync(quizId)
            ?? throw new Exception("Quiz not found");

        var session = new Session
        {
            Id = Guid.NewGuid(),
            SessionCode = QuizCodeGenerator.GenerateQuizCode(),
            QuizId = quizId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();
        return session;
    }

    public async Task StartSessionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        session.IsStarted = true;
        session.StartedAt = DateTime.UtcNow;
        session.CurrentQuestionIndex = 0;
        await _context.SaveChangesAsync();
    }

    public async Task InitializeShufflingAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return;
        var quiz = session.Quiz;
        if (quiz == null) return;

        if (!quiz.ShuffleQuestions) return; // No shuffling needed

        var questionIds = quiz.Questions.Select(q => q.Id).ToList();
        var participants = await _context.SessionParticipants
            .Where(p => p.SessionId == session.Id)
            .ToListAsync();

        var rng = new Random();
        foreach (var participant in participants)
        {
            var shuffled = questionIds.OrderBy(_ => rng.Next()).ToList();
            _shuffledQuestionOrders[(session.Id, participant.Id)] = shuffled;
        }
    }

    public async Task PauseSessionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        session.IsPaused = true;
        await _context.SaveChangesAsync();
    }

    public async Task ResumeSessionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        session.IsPaused = false;
        await _context.SaveChangesAsync();
    }

    public async Task NextQuestionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session.CurrentQuestionIndex < session.Quiz!.Questions.Count - 1)
        {
            session.CurrentQuestionIndex++;
            await _context.SaveChangesAsync();
        }
    }

    public async Task PreviousQuestionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session.CurrentQuestionIndex > 0)
        {
            session.CurrentQuestionIndex--;
            await _context.SaveChangesAsync();
        }
    }

    public async Task JumpToQuestionAsync(string sessionCode, int questionIndex)
    {
        var session = await GetSessionAsync(sessionCode);
        if (questionIndex >= 0 && questionIndex < session.Quiz!.Questions.Count)
        {
            session.CurrentQuestionIndex = questionIndex;
            await _context.SaveChangesAsync();
        }
    }

    public async Task EndSessionAsync(string sessionCode)
    {
        var session = await GetSessionAsync(sessionCode);
        session.IsEnded = true;
        session.EndedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task AddParticipantAsync(string sessionCode, string connectionId, string name, string employeeId)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return; // Session not found, abort to avoid 400 errors

        if (name == "Teacher")
        {
            // Do not create a participant entry for the teacher
            return;
        }

        // Enforce max attempts per student
        var canJoin = await CanStudentJoinAsync(sessionCode, name);
        if (!canJoin)
        {
            Console.WriteLine($"[JOIN] Student {name} exceeded max attempts for session {sessionCode}.");
            return;
        }

        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == name);

        if (participant == null)
        {
            participant = new SessionParticipant
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                StudentName = name,
                EmployeeId = employeeId,
                IsConnected = true,
                JoinedAt = DateTime.UtcNow
            };
            _context.SessionParticipants.Add(participant);
        }
        else
        {
            if (participant.IsConnected)
            {
                // Flag multiple device login
                participant.SuspicionScore = Math.Min(100, participant.SuspicionScore + 35);
            }
            participant.IsConnected = true;
        }

        await _context.SaveChangesAsync();
    }

    // Checks if a student has remaining attempts based on quiz.MaxAttempts
    public async Task<bool> CanStudentJoinAsync(string sessionCode, string studentName)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return false;
        var quiz = session.Quiz;
        if (quiz == null) return false;
        // Count attempts for this student on this quiz
        var user = await _context.Users
    .FirstOrDefaultAsync(u => u.Name == studentName);

if (user == null)
    return true;

var attempts = await _context.QuizAttempts
    .CountAsync(a => a.QuizId == quiz.Id &&
                     a.StudentId == user.Id);
        return attempts < quiz.MaxAttempts;
    }

    public async Task RemoveParticipantAsync(string sessionCode, string studentName)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return;
        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == studentName);
        if (participant != null)
        {
            participant.IsConnected = false;
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<LiveParticipantDto>> GetParticipantsAsync(string sessionCode)
    {
        // Retrieve session; if not found return empty list to avoid 400 errors
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return new List<LiveParticipantDto>();
        var participants = await _context.SessionParticipants
            .Where(p => p.SessionId == session.Id)
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.AverageTimeTakenMs)
            .ToListAsync();
        var dtos = new List<LiveParticipantDto>();
        for (int i = 0; i < participants.Count; i++)
        {
            var p = participants[i];
            dtos.Add(new LiveParticipantDto
            {
                Id = p.Id,
                Name = p.StudentName,
                EmployeeId = p.EmployeeId,
                IsConnected = p.IsConnected,
                Score = p.Score,
                CorrectAnswers = p.CorrectAnswers,
                WrongAnswers = p.WrongAnswers,
                SkippedAnswers = p.SkippedAnswers,
                AverageTimeTakenMs = p.AverageTimeTakenMs,
                SuspicionScore = p.SuspicionScore,
                Rank = i + 1,
                CurrentQuestionIndex = _participantQuestions.TryGetValue(p.Id, out var qIdx) ? qIdx : 0
            });
        }
        return dtos;
    }

    public async Task SubmitAnswerAsync(string sessionCode, string studentName, Guid questionId, string selectedOption, int timeTakenMs)
    {
        var session = await GetSessionAsync(sessionCode);
        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == studentName);

        if (participant == null) return;

        var question = session.Quiz!.Questions.FirstOrDefault(q => q.Id == questionId);
        if (question == null) return;

        var existingAnswer = await _context.SessionParticipantAnswers
            .FirstOrDefaultAsync(a => a.SessionId == session.Id && a.SessionParticipantId == participant.Id && a.QuestionId == questionId);

        if (existingAnswer != null) return; // Prevent multiple answers

        bool isCorrect = !string.IsNullOrEmpty(selectedOption) && string.Equals(question.CorrectAnswer, selectedOption, StringComparison.OrdinalIgnoreCase);

        var answer = new SessionParticipantAnswer
        {
            Id = Guid.NewGuid(),
            SessionId = session.Id,
            SessionParticipantId = participant.Id,
            QuestionId = questionId,
            SelectedOption = selectedOption ?? string.Empty,
            IsCorrect = isCorrect,
            TimeTakenMs = timeTakenMs,
            SubmittedAt = DateTime.UtcNow
        };

        _context.SessionParticipantAnswers.Add(answer);

        // Update Participant Stats
        if (isCorrect)
        {
            participant.Score += 1000 - (timeTakenMs / 100); // Simple time-based score logic
            participant.CorrectAnswers++;
        }
        else if (string.IsNullOrEmpty(selectedOption))
        {
            participant.SkippedAnswers++;
        }
        else
        {
            participant.WrongAnswers++;
        }

        // Update moving average
        int totalAnswers = participant.CorrectAnswers + participant.WrongAnswers + participant.SkippedAnswers;
        participant.AverageTimeTakenMs = ((participant.AverageTimeTakenMs * (totalAnswers - 1)) + timeTakenMs) / totalAnswers;

        await _context.SaveChangesAsync();
    }

    public async Task<LiveQuestionAnalyticsDto> GetQuestionAnalyticsAsync(string sessionCode, Guid questionId)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return new LiveQuestionAnalyticsDto();
        var answers = await _context.SessionParticipantAnswers
            .Where(a => a.SessionId == session.Id && a.QuestionId == questionId)
            .ToListAsync();

        return new LiveQuestionAnalyticsDto
        {
            QuestionId = questionId,
            CorrectCount = answers.Count(a => a.IsCorrect),
            WrongCount = answers.Count(a => !a.IsCorrect && !string.IsNullOrEmpty(a.SelectedOption)),
            SkippedCount = answers.Count(a => string.IsNullOrEmpty(a.SelectedOption)),
            OptionACount = answers.Count(a => string.Equals(a.SelectedOption, "A", StringComparison.OrdinalIgnoreCase)),
            OptionBCount = answers.Count(a => string.Equals(a.SelectedOption, "B", StringComparison.OrdinalIgnoreCase)),
            OptionCCount = answers.Count(a => string.Equals(a.SelectedOption, "C", StringComparison.OrdinalIgnoreCase)),
            OptionDCount = answers.Count(a => string.Equals(a.SelectedOption, "D", StringComparison.OrdinalIgnoreCase)),
        };
    }

    public async Task<bool> EndSessionAndPersistResultsAsync(string sessionCode)
    {
        var session = await _context.Sessions
            .Include(s => s.Quiz)
            .ThenInclude(q => q.Questions)
            .FirstOrDefaultAsync(s => s.SessionCode == sessionCode);
            
        if (session == null) return false;

        session.IsEnded = true;
        session.EndedAt = DateTime.UtcNow;

        // Fetch participants
        var participants = await _context.SessionParticipants
            .Where(p => p.SessionId == session.Id)
            .ToListAsync();

        var completedAt = DateTime.UtcNow;

        // For each participant, auto-submit incomplete questions and calculate final score/rank
        foreach (var p in participants)
        {
            var participantAnswers = await _context.SessionParticipantAnswers
                .Where(a => a.SessionId == session.Id && a.SessionParticipantId == p.Id)
                .ToListAsync();

            if (session.Quiz != null)
            {
                foreach (var q in session.Quiz.Questions)
                {
                    var answered = participantAnswers.Any(a => a.QuestionId == q.Id);
                    if (!answered)
                    {
                        var skipAnswer = new SessionParticipantAnswer
                        {
                            Id = Guid.NewGuid(),
                            SessionId = session.Id,
                            SessionParticipantId = p.Id,
                            QuestionId = q.Id,
                            SelectedOption = string.Empty,
                            IsCorrect = false,
                            TimeTakenMs = 0,
                            SubmittedAt = DateTime.UtcNow
                        };
                        _context.SessionParticipantAnswers.Add(skipAnswer);
                        p.SkippedAnswers++;
                        participantAnswers.Add(skipAnswer);
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        // Sort participants to establish final rank
        var rankedParticipants = participants
            .OrderByDescending(p => p.Score)
            .ThenBy(p => p.AverageTimeTakenMs)
            .ToList();

        for (int i = 0; i < rankedParticipants.Count; i++)
        {
            var p = rankedParticipants[i];

            // 1. Create or Find a Guest User in the database
            var guestUser = await _context.Users.FirstOrDefaultAsync(u => u.Name == p.StudentName);
            if (guestUser == null)
            {
                guestUser = new User
                {
                    Id = Guid.NewGuid(),
                    Name = p.StudentName,
                    Email = $"guest_{Guid.NewGuid().ToString().Substring(0, 8)}@quiznova.local",
                    PasswordHash = "GUEST_NO_PASSWORD",
                    Role = "Student",
                    CreatedAt = DateTime.UtcNow
                };
                _context.Users.Add(guestUser);
                await _context.SaveChangesAsync();
            }

            // 2. Avoid duplicate QuizResult rows
            var exists = await _context.QuizResults.AnyAsync(r => r.SessionId == session.Id && r.StudentId == p.Id);
            if (!exists)
            {
                var quizResult = new QuizResult
                {
                    Id = Guid.NewGuid(),
                    SessionId = session.Id,
                    StudentId = p.Id,
                    StudentName = p.StudentName,
                    EmployeeId = p.EmployeeId,
                    QuizId = session.QuizId,
                    Score = p.Score,
                    CorrectCount = p.CorrectAnswers,
                    IncorrectCount = p.WrongAnswers,
                    AverageTime = p.AverageTimeTakenMs,
                    Rank = i + 1,
                    CompletedAt = completedAt
                };

                _context.QuizResults.Add(quizResult);
            }

            // 3. Create a compatible QuizAttempt row
            var attemptExists = await _context.QuizAttempts.AnyAsync(a => a.SessionId == session.Id && a.StudentId == guestUser.Id);
            if (!attemptExists)
            {
                var totalQuestionsCount = session.Quiz?.Questions.Count ?? 0;
                var quizAttempt = new QuizAttempt
                {
                    Id = Guid.NewGuid(),
                    SessionId = session.Id,
                    QuizId = session.QuizId,
                    StudentId = guestUser.Id,
                    EmployeeId = p.EmployeeId,
                    Score = p.Score,
                    TotalQuestions = totalQuestionsCount,
                    CorrectAnswers = p.CorrectAnswers,
                    WrongAnswers = p.WrongAnswers,
                    SkippedQuestions = p.SkippedAnswers,
                    Percentage = totalQuestionsCount > 0 ? ((double)p.CorrectAnswers / totalQuestionsCount) * 100 : 0,
                    Accuracy = (p.CorrectAnswers + p.WrongAnswers + p.SkippedAnswers) > 0 ? ((double)p.CorrectAnswers / (p.CorrectAnswers + p.WrongAnswers + p.SkippedAnswers)) * 100 : 0,
                    CompletionStatus = "Completed",
                    TimeTakenMilliseconds = (int)(p.AverageTimeTakenMs * (p.CorrectAnswers + p.WrongAnswers + p.SkippedAnswers)),
                    TimeTakenSeconds = (int)((p.AverageTimeTakenMs * (p.CorrectAnswers + p.WrongAnswers + p.SkippedAnswers)) / 1000),
                    Completed = true,
                    Rank = i + 1,
                    StartedAt = session.StartedAt ?? session.CreatedAt,
                    SubmittedAt = completedAt,
                    CompletedAt = completedAt,
                    PassMark = 50 // default passing score
                };
                _context.QuizAttempts.Add(quizAttempt);

                var participantAnswers = await _context.SessionParticipantAnswers
                    .Where(a => a.SessionId == session.Id && a.SessionParticipantId == p.Id)
                    .ToListAsync();

                foreach (var pa in participantAnswers)
                {
                    // Create StudentAnswer for live details
                    var studentAnswer = new StudentAnswer
                    {
                        Id = Guid.NewGuid(),
                        StudentId = p.Id,
                        StudentName = p.StudentName,
                        QuestionId = pa.QuestionId,
                        SelectedOption = pa.SelectedOption,
                        IsCorrect = pa.IsCorrect,
                        TimeTaken = pa.TimeTakenMs,
                        ScoreEarned = pa.IsCorrect ? (1000 - (pa.TimeTakenMs / 100)) : 0,
                        SessionId = session.Id
                    };
                    _context.StudentAnswers.Add(studentAnswer);

                    // Create QuizAnswer for report compatibility
                    var quizAnswer = new QuizAnswer
                    {
                        Id = Guid.NewGuid(),
                        AttemptId = quizAttempt.Id,
                        QuestionId = pa.QuestionId,
                        SelectedAnswer = pa.SelectedOption,
                        IsCorrect = pa.IsCorrect,
                        ResponseTimeMs = pa.TimeTakenMs
                    };
                    _context.QuizAnswers.Add(quizAnswer);
                }
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task ReportSuspiciousActivityAsync(string sessionCode, string studentName, string activityType)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return;

        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == studentName);

        if (participant == null) return;

        if (activityType == "TabSwitch")
        {
            participant.TabSwitchCount++;
        }
        else if (activityType == "WindowBlur")
        {
            participant.WindowBlurCount++;
        }
        else if (activityType == "FullscreenExit")
        {
            participant.FullscreenExitCount++;
        }
        else if (activityType == "Copy")
        {
            participant.CopyAttempts++;
        }

        // Calculate suspicion score
        participant.SuspicionScore = Math.Min(100, 
            (participant.TabSwitchCount * 15) + 
            (participant.WindowBlurCount * 10) + 
            (participant.FullscreenExitCount * 20) + 
            (participant.CopyAttempts * 25));

        await _context.SaveChangesAsync();
    }

    public async Task UpdateCurrentQuestionAsync(string sessionCode, string studentName, int questionIndex)
    {
        var session = await GetSessionAsync(sessionCode);
        if (session == null) return;

        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == session.Id && p.StudentName == studentName);

        if (participant != null)
        {
            _participantQuestions[participant.Id] = questionIndex;
        }
    }
}
