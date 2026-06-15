namespace backend.Services;

public interface ILobbyService
{
    void AddParticipant(
        string sessionCode,
        string connectionId,
        string studentName
    );

    void RemoveParticipant(
        string sessionCode,
        string connectionId
    );

    IReadOnlyCollection<string> GetParticipantNames(
        string sessionCode
    );
    void RecordAnswer(
        string sessionCode,
        string connectionId,
        bool isCorrect,
        int timeTakenMs
    );

    IReadOnlyCollection<object> GetLeaderboard(
        string sessionCode
    );

    IReadOnlyCollection<string> GetAllSessionCodes();
}