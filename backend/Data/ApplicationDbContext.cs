using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options
    ) : base(options)
    {
    }

    // Core Tables
    public DbSet<User> Users => Set<User>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<StudentEnrollment> StudentEnrollments => Set<StudentEnrollment>();
    public DbSet<Folder> Folders => Set<Folder>();

    // Live Session Tables
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<SessionParticipant> SessionParticipants => Set<SessionParticipant>();
    public DbSet<SessionParticipantAnswer> SessionParticipantAnswers => Set<SessionParticipantAnswer>();
    public DbSet<SessionAnalytics> SessionAnalytics => Set<SessionAnalytics>();

    // Persisted Live Session Results
    public DbSet<QuizResult> QuizResults => Set<QuizResult>();
    public DbSet<StudentAnswer> StudentAnswers => Set<StudentAnswer>();

    // AI
    public DbSet<AIQuizLog> AIQuizLogs => Set<AIQuizLog>();

    // Quiz Answers
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Question -> Quiz
        modelBuilder.Entity<Question>()
            .HasOne(q => q.Quiz)
            .WithMany(qz => qz.Questions)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        // Quiz -> Folder
        modelBuilder.Entity<Quiz>()
            .HasOne(q => q.Folder)
            .WithMany(f => f.Quizzes)
            .HasForeignKey(q => q.FolderId)
            .OnDelete(DeleteBehavior.SetNull);

        // Folder Self Reference
        modelBuilder.Entity<Folder>()
            .HasOne(f => f.ParentFolder)
            .WithMany(f => f.SubFolders)
            .HasForeignKey(f => f.ParentFolderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Quiz Attempt -> Student
        modelBuilder.Entity<QuizAttempt>()
            .HasOne(a => a.Student)
            .WithMany(u => u.QuizAttempts)
            .HasForeignKey(a => a.StudentId);

        // Quiz Attempt -> Quiz
        modelBuilder.Entity<QuizAttempt>()
            .HasOne(a => a.Quiz)
            .WithMany(q => q.Attempts)
            .HasForeignKey(a => a.QuizId);

        // ====================================================
        // LIVE SESSION RELATIONSHIPS
        // ====================================================

        // SessionParticipant -> Session
        modelBuilder.Entity<SessionParticipant>()
            .HasOne(p => p.Session)
            .WithMany()
            .HasForeignKey(p => p.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // SessionParticipantAnswer -> Participant
        modelBuilder.Entity<SessionParticipantAnswer>()
            .HasOne(a => a.Participant)
            .WithMany()
            .HasForeignKey(a => a.SessionParticipantId)
            .OnDelete(DeleteBehavior.Cascade);

        // SessionParticipantAnswer -> Question
        modelBuilder.Entity<SessionParticipantAnswer>()
            .HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        // SessionParticipantAnswer -> Session
        modelBuilder.Entity<SessionParticipantAnswer>()
            .HasOne(a => a.Session)
            .WithMany()
            .HasForeignKey(a => a.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // SessionAnalytics -> Session
        modelBuilder.Entity<SessionAnalytics>()
            .HasOne(a => a.Session)
            .WithMany()
            .HasForeignKey(a => a.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // QuizResult -> Session
        modelBuilder.Entity<QuizResult>()
            .HasOne(r => r.Session)
            .WithMany()
            .HasForeignKey(r => r.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // QuizResult -> Quiz
        modelBuilder.Entity<QuizResult>()
            .HasOne(r => r.Quiz)
            .WithMany()
            .HasForeignKey(r => r.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        // StudentAnswer -> Question
        modelBuilder.Entity<StudentAnswer>()
            .HasOne(a => a.Question)
            .WithMany()
            .HasForeignKey(a => a.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}