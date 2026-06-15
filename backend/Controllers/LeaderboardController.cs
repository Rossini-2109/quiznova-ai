using Microsoft.AspNetCore.Mvc;
using backend.Services;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeaderboardController : ControllerBase
{
    private readonly ILobbyService _lobbyService;

    public LeaderboardController(ILobbyService lobbyService)
    {
        _lobbyService = lobbyService;
    }

    [HttpGet("{quizCode}")]
    public IActionResult GetLeaderboard(string quizCode)
    {
        var leaderboard = _lobbyService.GetLeaderboard(quizCode);
        return Ok(leaderboard);
    }
}
