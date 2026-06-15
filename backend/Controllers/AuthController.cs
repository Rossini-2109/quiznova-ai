using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using backend.Data;
using backend.Models;
using backend.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(ApplicationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToArray();
            return BadRequest(new { message = "Validation failed", errors });
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name, email, and password are required.");
        }

        if (request.Password.Length < 6)
        {
            return BadRequest("Password must be at least 6 characters long.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        // Check if user already exists
        var userExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail);
        if (userExists)
        {
            return BadRequest("A user with this email address already exists.");
        }

        // Hash password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create new user
        string role = request.Role?.Trim() ?? "";

        if (
            role != "Teacher" &&
            role != "Student"
        )
        {
            return BadRequest(
                "Role must be Teacher or Student"
            );
        }

        var newUser = new User
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            PasswordHash = passwordHash,
            Role = role,
            XP = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Generate JWT token
        var token = GenerateJwtToken(newUser);

        var response = new AuthResponse
        {
            Id = newUser.Id,
            Name = newUser.Name,
            Email = newUser.Email,
            Role = newUser.Role,
            XP = newUser.XP,
            CreatedAt = newUser.CreatedAt,
            Token = token
        };

        return CreatedAtAction(nameof(GetMe), null, response);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest("Email and password are required.");
        }

        var normalizedEmail = request.Email.Trim().ToLower();

        // Find user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
        if (user == null)
        {
            return Unauthorized("Invalid email or password.");
        }

        // Verify password
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return Unauthorized("Invalid email or password.");
        }

        // Generate JWT token
        var token = GenerateJwtToken(user);

        var response = new AuthResponse
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            XP = user.XP,
            CreatedAt = user.CreatedAt,
            Token = token
        };

        return Ok(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !Guid.TryParse(userIdClaim.Value, out Guid userId))
        {
            return Unauthorized();
        }

        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound("User not found.");
        }

        return Ok(new
        {
            user.Id,
            user.Name,
            user.Email,
            user.Role,
            user.XP,
            user.CreatedAt
        });
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("Jwt");
        var jwtKey = jwtSettings["Key"] ?? "A_Very_Secure_And_Super_Secret_Key_For_QuizNovaAI_12345!";
        var keyBytes = Encoding.UTF8.GetBytes(jwtKey);

        var tokenHandler = new JwtSecurityTokenHandler();
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddMinutes(double.Parse((jwtSettings["DurationInMinutes"] ?? "1440").ToString())),
            Issuer = jwtSettings["Issuer"] ?? "QuizNovaAIBackend",
            Audience = jwtSettings["Audience"] ?? "QuizNovaAIFrontend",
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(keyBytes), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}