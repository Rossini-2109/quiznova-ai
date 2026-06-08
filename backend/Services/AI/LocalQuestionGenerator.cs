using backend.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace backend.Services.AI;

public class LocalQuestionGenerator : IAIProvider
{
    public Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text)
    {
        var questions = new List<GeneratedQuestionDto>();
        
        var sentences = Regex.Split(text, @"(?<=[\.!\?])\s+")
                             .Select(s => s.Trim())
                             .Where(s => s.Length > 20 && s.Length < 200)
                             .ToList();

        var random = new Random();
        var allWords = sentences.SelectMany(s => s.Split(' '))
                                .Select(w => Regex.Replace(w, @"[^\w]", ""))
                                .Where(w => w.Length > 5)
                                .Distinct()
                                .ToList();

        int maxQuestions = Math.Min(10, sentences.Count);
        var selectedSentences = sentences.OrderBy(x => random.Next()).Take(maxQuestions).ToList();

        foreach (var sentence in selectedSentences)
        {
            var words = sentence.Split(' ')
                                .Select(w => Regex.Replace(w, @"[^\w]", ""))
                                .Where(w => w.Length > 4)
                                .ToList();
                                
            if (words.Count == 0) continue;

            string cleanKeyword = words[random.Next(words.Count)];

            if (string.IsNullOrWhiteSpace(cleanKeyword)) continue;

            // Simple replace (only first occurrence to avoid messing up multiple same words)
            var regex = new Regex($@"\b{Regex.Escape(cleanKeyword)}\b", RegexOptions.IgnoreCase);
            string questionText = regex.Replace(sentence, "_____", 1);

            if (questionText == sentence) continue; // Keyword wasn't properly replaced

            var options = new List<string> { cleanKeyword };
            
            var distractors = allWords.Where(w => !string.Equals(w, cleanKeyword, StringComparison.OrdinalIgnoreCase))
                                      .OrderBy(x => random.Next())
                                      .Take(3)
                                      .ToList();
                                      
            while (distractors.Count < 3)
            {
                distractors.Add("Generic Concept " + random.Next(1, 1000)); 
            }

            options.AddRange(distractors);
            
            options = options.OrderBy(x => random.Next()).ToList();
            
            var correctIndex = options.IndexOf(cleanKeyword);
            string correctLetter = correctIndex switch { 0 => "A", 1 => "B", 2 => "C", _ => "D" };

            questions.Add(new GeneratedQuestionDto
            {
                Question = questionText,
                Options = options,
                CorrectAnswer = correctLetter,
                Explanation = $"The statement is: {sentence}"
            });
        }

        return Task.FromResult(questions);
    }
}
