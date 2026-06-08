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

    public OpenAIProvider(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _apiKey = config["OpenAI:ApiKey"] ?? "";
    }

    public async Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        if (string.IsNullOrEmpty(_apiKey))
            throw new Exception("OpenAI API Key is missing. Please configure 'OpenAI:ApiKey' in appsettings.json.");

        var requestBody = new
        {
            model = "gpt-4o",
            messages = new[]
            {
                new { role = "system", content = "You are a quiz generator. Extract facts from the provided text and generate a JSON array of multiple choice questions. The JSON format must exactly be: [{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correctAnswer\":\"A\",\"explanation\":\"...\"}]" },
                new { role = "user", content = text }
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

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<GeneratedQuestionDto>>(messageContent.Trim(), options) ?? new List<GeneratedQuestionDto>();
    }
}
