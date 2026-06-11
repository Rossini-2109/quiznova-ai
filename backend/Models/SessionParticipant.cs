namespace backend.Models;

public class SessionParticipant
{
    public Guid Id { get; set; }

    public Guid SessionId { get; set; }

    public Session? Session { get; set; }

    public string StudentName { get; set; }
        = string.Empty;

    public string EmployeeId { get; set; }
        = string.Empty;

    public bool IsConnected { get; set; }

    public DateTime JoinedAt { get; set; }
        = DateTime.UtcNow;
}