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

    public DbSet<User> Users => Set<User>();
    public DbSet<Quiz> Quizzes => Set<Quiz>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuizAttempt> QuizAttempts => Set<QuizAttempt>();
    public DbSet<QuizAnswer> QuizAnswers => Set<QuizAnswer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
{
    base.OnModelCreating(modelBuilder);

    modelBuilder.Entity<Question>()
        .HasOne(q => q.Quiz)
        .WithMany(qz => qz.Questions)
        .HasForeignKey(q => q.QuizId)
        .OnDelete(DeleteBehavior.Cascade);

    modelBuilder.Entity<QuizAttempt>()
        .HasOne(a => a.Student)
        .WithMany(u => u.QuizAttempts)
        .HasForeignKey(a => a.StudentId);

    modelBuilder.Entity<QuizAttempt>()
        .HasOne(a => a.Quiz)
        .WithMany()
        .HasForeignKey(a => a.QuizId);
}
}