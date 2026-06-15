namespace backend.DTOs;

public class ShareQuizDto {
    public string Token { get; set; } = default!;
    public string Url => $"https://quiznova-ai-grdq.onrender.com/quiz/{Token}"; // Frontend URL placeholder
}
