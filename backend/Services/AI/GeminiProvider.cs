using backend.DTOs;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System;

namespace backend.Services.AI;

public class GeminiProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private const string SystemPrompt =
        "You are a quiz generator. Generate a JSON array of multiple choice questions based on the user's request. " +
        "Always return at least 4 options per question. Return only the JSON array, no markdown prose or backticks.";

    public GeminiProvider(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["Gemini:ApiKey"] ?? "";
    }

    public async Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new Exception("Gemini API Key is missing. Please configure 'Gemini:ApiKey' in appsettings.json.");

        var requestBody = new
        {
            contents = new object[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = $"{SystemPrompt}\n\nUser Request: {text}" }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "ARRAY",
                    items = new
                    {
                        type = "OBJECT",
                        properties = new
                        {
                            question = new { type = "STRING" },
                            options = new
                            {
                                type = "ARRAY",
                                items = new { type = "STRING" }
                            },
                            correctAnswer = new { type = "STRING" },
                            explanation = new { type = "STRING" }
                        },
                        required = new string[] { "question", "options", "correctAnswer", "explanation" }
                    }
                }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var response = await _httpClient.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Gemini API Error: {error}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(jsonResponse);
        var candidates = document.RootElement.GetProperty("candidates");
        if (candidates.GetArrayLength() == 0)
        {
            return new List<GeneratedQuestionDto>();
        }

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        if (parts.GetArrayLength() == 0)
        {
            return new List<GeneratedQuestionDto>();
        }

        var messageContent = parts[0].GetProperty("text").GetString() ?? "[]";

        // Clean any code block wrappers just in case
        messageContent = messageContent.Trim();
        if (messageContent.StartsWith("```json"))
        {
            messageContent = messageContent.Substring(7);
            if (messageContent.EndsWith("```"))
                messageContent = messageContent.Substring(0, messageContent.Length - 3);
        }
        else if (messageContent.StartsWith("```"))
        {
            messageContent = messageContent.Substring(3);
            if (messageContent.EndsWith("```"))
                messageContent = messageContent.Substring(0, messageContent.Length - 3);
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<GeneratedQuestionDto>>(messageContent.Trim(), options) ?? new List<GeneratedQuestionDto>();
    }

    public async Task<List<GeneratedQuestionDto>> GenerateFromImageAsync(string base64DataUri, string instructions)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new Exception("Gemini API Key is missing. Please configure 'Gemini:ApiKey' in appsettings.json.");

        // Parse base64 and mime type from data URI
        // Format: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...
        string mimeType = "image/jpeg";
        string base64Data = base64DataUri;

        if (base64DataUri.StartsWith("data:"))
        {
            int commaIndex = base64DataUri.IndexOf(',');
            if (commaIndex >= 0)
            {
                base64Data = base64DataUri.Substring(commaIndex + 1);
                string header = base64DataUri.Substring(0, commaIndex);
                int colonIndex = header.IndexOf(':');
                int semiColonIndex = header.IndexOf(';');
                if (colonIndex >= 0 && semiColonIndex > colonIndex)
                {
                    mimeType = header.Substring(colonIndex + 1, semiColonIndex - colonIndex - 1);
                }
            }
        }

        var requestBody = new
        {
            contents = new object[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = $"{SystemPrompt}\n\nInstructions: {instructions}" },
                        new
                        {
                            inlineData = new
                            {
                                mimeType = mimeType,
                                data = base64Data
                            }
                        }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                responseSchema = new
                {
                    type = "ARRAY",
                    items = new
                    {
                        type = "OBJECT",
                        properties = new
                        {
                            question = new { type = "STRING" },
                            options = new
                            {
                                type = "ARRAY",
                                items = new { type = "STRING" }
                            },
                            correctAnswer = new { type = "STRING" },
                            explanation = new { type = "STRING" }
                        },
                        required = new string[] { "question", "options", "correctAnswer", "explanation" }
                    }
                }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

        var response = await _httpClient.PostAsync(url, content);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Gemini API Error: {error}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(jsonResponse);
        var candidates = document.RootElement.GetProperty("candidates");
        if (candidates.GetArrayLength() == 0)
        {
            return new List<GeneratedQuestionDto>();
        }

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        if (parts.GetArrayLength() == 0)
        {
            return new List<GeneratedQuestionDto>();
        }

        var messageContent = parts[0].GetProperty("text").GetString() ?? "[]";

        messageContent = messageContent.Trim();
        if (messageContent.StartsWith("```json"))
        {
            messageContent = messageContent.Substring(7);
            if (messageContent.EndsWith("```"))
                messageContent = messageContent.Substring(0, messageContent.Length - 3);
        }
        else if (messageContent.StartsWith("```"))
        {
            messageContent = messageContent.Substring(3);
            if (messageContent.EndsWith("```"))
                messageContent = messageContent.Substring(0, messageContent.Length - 3);
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<GeneratedQuestionDto>>(messageContent.Trim(), options) ?? new List<GeneratedQuestionDto>();
    }
}
