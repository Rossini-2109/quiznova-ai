namespace backend.DTOs;

public class ShareQuizDto {
    public string Token { get; set; } = default!;
    public string Url => $"http://localhost:3000/quiz/{Token}"; // Frontend URL placeholder
}
