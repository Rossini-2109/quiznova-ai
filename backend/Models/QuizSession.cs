using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class QuizSession
    {
        [Key]
        public Guid Id { get; set; }
        public string SessionCode { get; set; } = null!;
        public Guid QuizId { get; set; }
        public string TeacherId { get; set; } = null!;
        public string Status { get; set; } = "Pending"; // Pending, Running, Paused, Ended
        public DateTime? StartedAt { get; set; }
        public DateTime? EndedAt { get; set; }
        public int MaxAttempts { get; set; } = 1;
        public bool ShuffleQuestions { get; set; } = false;
    }
}
