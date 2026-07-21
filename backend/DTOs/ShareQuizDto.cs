using System;

namespace backend.DTOs;

public class ShareQuizDto {
    public string Token { get; set; } = default!;
    public string Url
    {
        get
        {
            var frontendUrl = (Environment.GetEnvironmentVariable("FRONTEND_URL")
                ?? Environment.GetEnvironmentVariable("NEXT_PUBLIC_FRONTEND_URL")
                ?? "https://quiznova-ai-eta.vercel.app").TrimEnd('/');
            return $"{frontendUrl}/quiz/{Token}";
        }
    }
}
