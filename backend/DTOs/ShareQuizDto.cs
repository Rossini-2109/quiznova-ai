using System;

namespace backend.DTOs;

public class ShareQuizDto {
    public string Token { get; set; } = default!;
    public string Url
    {
        get
        {
            var rawFrontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL")
                ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_FRONTEND_URL");
            var frontendUrl = (string.IsNullOrWhiteSpace(rawFrontendUrl) || rawFrontendUrl.Contains("onrender.com"))
                ? "https://quiznova-ai-eta.vercel.app"
                : rawFrontendUrl.TrimEnd('/');
            return $"{frontendUrl}/quiz/{Token}";
        }
    }
}
