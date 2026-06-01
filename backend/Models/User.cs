namespace backend.Models;

public class User
{
    public Guid Id { get; set; }

    public string Name { get; set; } = "";

    public string Email { get; set; } = "";

    public string PasswordHash { get; set; } = "";

    public string Role { get; set; } = "";

    public int XP { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}