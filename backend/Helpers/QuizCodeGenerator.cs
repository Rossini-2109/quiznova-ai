namespace backend.Helpers;

public static class QuizCodeGenerator
{
    public static string GenerateQuizCode()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        var random = new Random();

        return new string(
            Enumerable.Repeat(chars, 6)
                .Select(s => s[random.Next(s.Length)])
                .ToArray()
        );
    }
}