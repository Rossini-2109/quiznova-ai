using backend.DTOs;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using System;
using Microsoft.Extensions.Configuration;

namespace backend.Services.AI;

public class OllamaProvider : IAIProvider
{
    private readonly HttpClient _httpClient;
    private readonly string _ollamaUrl;
    private readonly string _model;

    public OllamaProvider(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _ollamaUrl = config["Ollama:Url"] ?? "http://localhost:11434";
        _model = config["Ollama:Model"] ?? "llama3";
    }

    public async Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        var prompt = $"Extract facts from the provided text and generate a JSON array of multiple choice questions. The JSON format must exactly be: [{{\"question\":\"...\",\"options\":[\"...\",\"...\",\"...\",\"...\"],\"correctAnswer\":\"A\",\"explanation\":\"...\"}}]. Do not output any markdown or explanation, just the raw JSON array. Text: {text}";

        var requestBody = new
        {
            model = _model,
            prompt = prompt,
            stream = false,
            format = "json"
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var response = await _httpClient.PostAsync($"{_ollamaUrl}/api/generate", content);
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"Ollama API Error: {error}");
        }

        var jsonResponse = await response.Content.ReadAsStringAsync();
        
        using var document = JsonDocument.Parse(jsonResponse);
        var messageContent = document.RootElement.GetProperty("response").GetString() ?? "[]";

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        return JsonSerializer.Deserialize<List<GeneratedQuestionDto>>(messageContent.Trim(), options) ?? new List<GeneratedQuestionDto>();
    }
}
