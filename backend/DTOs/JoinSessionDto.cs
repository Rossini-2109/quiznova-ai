namespace backend.DTOs;

public class JoinSessionDto
{
    public string SessionCode { get; set; }
        = string.Empty;

    public string StudentName { get; set; }
        = string.Empty;

    public string EmployeeId { get; set; }
        = string.Empty;
}