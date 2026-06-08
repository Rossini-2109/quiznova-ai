using backend.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services.AI;

public interface IAIProvider
{
    Task<List<GeneratedQuestionDto>> GenerateQuestionsAsync(string text);
}
