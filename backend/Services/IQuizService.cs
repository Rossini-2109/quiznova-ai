using backend.DTOs;

namespace backend.Services;

public interface IQuizService
{
    Task<object> JoinSession(
        JoinSessionDto dto
    );

    Task<object> GetLeaderboard(
        Guid sessionId
    );

    Task<bool> StartSession(
        Guid sessionId
    );
}