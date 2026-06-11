using System.Collections.Concurrent;

namespace backend.Services;

public class LobbyService : ILobbyService
{
    private readonly ConcurrentDictionary<
        string,
        ConcurrentDictionary<string, string>
    > _sessions = new();

    public void AddParticipant(
        string sessionCode,
        string connectionId,
        string studentName
    )
    {
        var participants = _sessions.GetOrAdd(
            sessionCode,
            _ => new ConcurrentDictionary<string, string>()
        );

        participants[connectionId] = studentName;
    }

    public void RemoveParticipant(
        string sessionCode,
        string connectionId
    )
    {
        if (_sessions.TryGetValue(sessionCode, out var participants))
        {
            participants.TryRemove(connectionId, out _);

            if (participants.IsEmpty)
            {
                _sessions.TryRemove(sessionCode, out _);
            }
        }
    }

    public IReadOnlyCollection<string> GetParticipantNames(
        string sessionCode
    )
    {
        if (_sessions.TryGetValue(sessionCode, out var participants))
        {
            return participants.Values
                .Distinct()
                .ToList()
                .AsReadOnly();
        }

        return new List<string>().AsReadOnly();
    }

    public IReadOnlyCollection<string> GetAllSessionCodes()
    {
        return _sessions.Keys
            .ToList()
            .AsReadOnly();
    }
}