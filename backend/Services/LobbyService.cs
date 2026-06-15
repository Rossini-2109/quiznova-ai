using System.Collections.Concurrent;

namespace backend.Services;

public class ParticipantStats
{
    public string Name { get; set; } = string.Empty;
    public int Score { get; set; }
    public int TimeTakenMs { get; set; }
}

public class LobbyService : ILobbyService
{
    // sessionCode -> (connectionId -> ParticipantStats)
    private readonly ConcurrentDictionary<
        string,
        ConcurrentDictionary<string, ParticipantStats>
    > _sessions = new();

    public void AddParticipant(
        string sessionCode,
        string connectionId,
        string studentName
    )
    {
        var participants = _sessions.GetOrAdd(
            sessionCode,
            _ => new ConcurrentDictionary<string, ParticipantStats>()
        );

        participants[connectionId] = new ParticipantStats { Name = studentName };
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
                .Select(p => p.Name)
                .Distinct()
                .ToList()
                .AsReadOnly();
        }

        return new List<string>().AsReadOnly();
    }

    public void RecordAnswer(
        string sessionCode,
        string connectionId,
        bool isCorrect,
        int timeTakenMs
    )
    {
        if (_sessions.TryGetValue(sessionCode, out var participants))
        {
            if (participants.TryGetValue(connectionId, out var stats))
            {
                if (isCorrect) stats.Score += 10; // Or passed from somewhere
                stats.TimeTakenMs += timeTakenMs;
            }
        }
    }

    public IReadOnlyCollection<object> GetLeaderboard(
        string sessionCode
    )
    {
        if (_sessions.TryGetValue(sessionCode, out var participants))
        {
            // Rank by Score descending, then Time Taken ascending
            var ranked = participants.Values
                .GroupBy(p => p.Name) // In case same name has multiple connections
                .Select(g => new {
                    Name = g.Key,
                    Score = g.Max(x => x.Score),
                    TimeTakenMs = g.Min(x => x.TimeTakenMs)
                })
                .OrderByDescending(p => p.Score)
                .ThenBy(p => p.TimeTakenMs)
                .Select((p, index) => new
                {
                    Rank = index + 1,
                    p.Name,
                    p.Score,
                    p.TimeTakenMs
                })
                .ToList<object>();

            return ranked.AsReadOnly();
        }

        return new List<object>().AsReadOnly();
    }

    public IReadOnlyCollection<string> GetAllSessionCodes()
    {
        return _sessions.Keys
            .ToList()
            .AsReadOnly();
    }
}