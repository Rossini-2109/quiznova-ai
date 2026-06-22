using backend.DTOs;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System;

namespace backend.Services.AI;

public class OpenAIProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;

    private const string SystemPrompt =
        "You are a quiz generator. Generate a JSON array of multiple choice questions based on the user's request. " +
        "The JSON format must exactly be: [{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correctAnswer\":\"A\",\"explanation\":\"...\"}]. " +
        "Always return at least 4 options per question. Return only the JSON array, no prose.";

    public OpenAIProvider(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["OpenAI:ApiKey"] ?? "";
    }

    public Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        var userContent = new object[]
        {
            new { type = "text", text = text }
        };
        return CompleteAsync(userContent);
    }

    // Generate from a source image using GPT-4o vision.
    public Task<List<GeneratedQuestionDto>> GenerateFromImageAsync(string base64DataUri, string instructions)
    {
        var userContent = new object[]
        {
            new { type = "text", text = instructions },
            new { type = "image_url", image_url = new { url = base64DataUri } }
        };
        return CompleteAsync(userContent);
    }

    private async Task<List<GeneratedQuestionDto>> CompleteAsync(object[] userContent)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new Exception("OpenAI API Key is missing. Please configure 'OpenAI:ApiKey' in appsettings.json.");

        var requestBody = new
        {
            model = "gpt-4o",
            messages = new object[]
            {
                new { role = "system", content = SystemPrompt },
                new { role = "user", content = userContent }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);

        var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"OpenAI API Error: {error}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();

        using var document = JsonDocument.Parse(jsonResponse);
        var messageContent = document.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content").GetString() ?? "[]";

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
