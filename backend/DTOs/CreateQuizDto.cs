namespace backend.DTOs;

public class CreateQuizDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; } // optional now
    // other properties unchanged

}