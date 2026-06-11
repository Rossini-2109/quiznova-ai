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

    IReadOnlyCollection<string> GetAllSessionCodes();
}