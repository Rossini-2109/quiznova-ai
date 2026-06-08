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

    public QuizGenerationService(IConfiguration config, LocalQuestionGenerator local, OpenAIProvider openAi, OllamaProvider ollama)
    {
        var provider = config["AIProvider"] ?? "Local";
        
        _aiProvider = provider.ToLowerInvariant() switch
        {
            "openai" => openAi,
            "ollama" => ollama,
            _ => local
        };
    }

    public async Task<List<GeneratedQuestionDto>> ProcessFileAsync(string filePath, string extension)
    {
        string extractedText = "";

        switch (extension.ToLowerInvariant())
        {
            case ".pdf":
                extractedText = PdfExtractor.Extract(filePath);
                break;
            case ".docx":
                extractedText = DocxExtractor.Extract(filePath);
                break;
            case ".pptx":
                extractedText = PptxExtractor.Extract(filePath);
                break;
            case ".txt":
            case ".json":
                extractedText = await File.ReadAllTextAsync(filePath);
                break;
            default:
                throw new Exception("Unsupported file type.");
        }

        if (string.IsNullOrWhiteSpace(extractedText))
        {
            throw new Exception("No text could be extracted from the file.");
        }

        if (extension.ToLowerInvariant() == ".json")
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

        return await _aiProvider.GenerateQuestionsAsync(extractedText);
    }
}
