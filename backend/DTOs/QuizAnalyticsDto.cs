using System;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class QuizAnalyticsDto
{
    [Required]
    public Guid QuizId { get; set; }

    public int TotalAttempts { get; set; }

    public double AverageScore { get; set; }

    public int HighestScore { get; set; }

    public int LowestScore { get; set; }

    // Future metrics placeholders
    // public double MedianScore { get; set; }
    // public TimeSpan AverageDuration { get; set; }
}
