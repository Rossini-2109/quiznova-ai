using System;

namespace backend.Models;

/// <summary>
/// Represents a shareable token that maps to a specific quiz attempt.
/// Used to generate URLs that can be shared to view a participant's result without authentication.
/// </summary>
public class ShareToken
{
    /// <summary>
    /// Primary key.
    /// </summary>
    public Guid Id { get; set; } = Guid.NewGuid();

    /// <summary>
    /// Token string (e.g., a short GUID or hash) used in the URL.
    /// </summary>
    public string Token { get; set; } = Guid.NewGuid().ToString("N");

    /// <summary>
    /// The quiz attempt this token grants access to.
    /// </summary>
    public Guid AttemptId { get; set; }
    public QuizAttempt? Attempt { get; set; }

    /// <summary>
    /// Optional expiration (null = never expires).
    /// </summary>
    public DateTime? ExpiresAt { get; set; }
}
