using backend.DTOs;
using backend.FileProcessing;
using backend.Services.AI;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace backend.Services;

public class QuizGenerationService
{
    private readonly IAIProvider _aiProvider;
    private readonly OpenAIProvider _openAi;
    private readonly bool _isOpenAi;

    private static readonly string[] ImageExtensions = { ".png", ".jpg", ".jpeg", ".webp", ".gif" };
    private static readonly string[] AudioExtensions = { ".mp3", ".wav", ".m4a", ".ogg", ".aac" };
    private static readonly string[] VideoExtensions = { ".mp4", ".mov", ".avi", ".webm", ".mkv" };

    public QuizGenerationService(IConfiguration config, LocalQuestionGenerator local, OpenAIProvider openAi, OllamaProvider ollama)
    {
        var provider = config["AIProvider"] ?? "Local";
        _openAi = openAi;
        _isOpenAi = provider.Equals("openai", StringComparison.OrdinalIgnoreCase);

        _aiProvider = provider.ToLowerInvariant() switch
        {
            "openai" => openAi,
            "ollama" => ollama,
            _ => local
        };
    }

    // Build an instruction header from the teacher's requirements + parameters.
    private static string BuildInstruction(string? requirements, int questionCount, string? difficulty)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Generate multiple choice quiz questions.");
        if (questionCount > 0)
            sb.AppendLine($"Number of questions: {questionCount}.");
        if (!string.IsNullOrWhiteSpace(difficulty))
            sb.AppendLine($"Difficulty: {difficulty}.");
        if (!string.IsNullOrWhiteSpace(requirements))
            sb.AppendLine($"Teacher requirements: {requirements}");
        return sb.ToString();
    }

    public async Task<List<GeneratedQuestionDto>> ProcessFileAsync(
        string filePath,
        string extension,
        string? requirements = null,
        int questionCount = 0,
        string? difficulty = null)
    {
        var ext = extension.ToLowerInvariant();
        var instruction = BuildInstruction(requirements, questionCount, difficulty);

        // Image -> vision generation (OpenAI only).
        if (Array.IndexOf(ImageExtensions, ext) >= 0)
        {
            if (!_isOpenAi)
                throw new Exception("Image-based generation requires the OpenAI provider. Set 'AIProvider' to 'openai' and configure 'OpenAI:ApiKey'.");

            var bytes = await File.ReadAllBytesAsync(filePath);
            var mime = ext switch
            {
                ".png" => "image/png",
                ".webp" => "image/webp",
                ".gif" => "image/gif",
                _ => "image/jpeg"
            };
            var dataUri = $"data:{mime};base64,{Convert.ToBase64String(bytes)}";
            var imageInstruction = instruction + "\nGenerate the questions from the content of the attached image.";
            return await _openAi.GenerateFromImageAsync(dataUri, imageInstruction);
        }

        // Audio / video -> needs a transcription pipeline that isn't configured yet.
        if (Array.IndexOf(AudioExtensions, ext) >= 0 || Array.IndexOf(VideoExtensions, ext) >= 0)
        {
            throw new Exception(
                "Audio and video generation requires a transcription service (e.g. OpenAI Whisper), which is not configured. " +
                "Please upload a document/image or describe the requirements as text.");
        }

        string extractedText = ext switch
        {
            ".pdf" => PdfExtractor.Extract(filePath),
            ".docx" => DocxExtractor.Extract(filePath),
            ".pptx" => PptxExtractor.Extract(filePath),
            ".txt" or ".json" => await File.ReadAllTextAsync(filePath),
            _ => throw new Exception("Unsupported file type.")
        };

        if (string.IsNullOrWhiteSpace(extractedText))
        {
            throw new Exception("No text could be extracted from the file.");
        }

        // Direct JSON import bypasses the AI provider.
        if (ext == ".json")
        {
            try
            {
                var options = new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                return System.Text.Json.JsonSerializer.Deserialize<List<GeneratedQuestionDto>>(extractedText, options)
                       ?? new List<GeneratedQuestionDto>();
            }
            catch
            {
                // Fallback to provider
            }
        }

        var prompt = string.IsNullOrWhiteSpace(instruction)
            ? extractedText
            : $"{instruction}\nSource material:\n{extractedText}";

        return await _aiProvider.GenerateQuestionsAsync(prompt);
    }

    // Generate purely from the teacher's text requirements (no file).
    public async Task<List<GeneratedQuestionDto>> GenerateFromRequirementsAsync(
        string requirements,
        int questionCount,
        string difficulty)
    {
        if (string.IsNullOrWhiteSpace(requirements))
            throw new Exception("Please provide requirements describing the quiz to generate.");

        var instruction = BuildInstruction(requirements, questionCount, difficulty);
        return await _aiProvider.GenerateQuestionsAsync(instruction);
    }
}
