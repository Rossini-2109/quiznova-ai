using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using backend.Data;

using backend.Services.AI;

using System.IO;
using backend.Services;
using backend.Hubs;

var builder = WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddSingleton<backend.Services.ILobbyService, backend.Services.LobbyService>();
builder.Services.AddScoped<backend.Services.ILiveQuizService, backend.Services.LiveQuizService>();

// AI Services
builder.Services.AddHttpClient<OpenAIProvider>();
builder.Services.AddHttpClient<OllamaProvider>();
builder.Services.AddHttpClient<GeminiProvider>();
builder.Services.AddScoped<LocalQuestionGenerator>();
builder.Services.AddScoped<QuizGenerationService>();
builder.Services.AddScoped<
    IQuizService,
    QuizService
>();
builder.Services.AddScoped<IQRCodeService, QRCodeService>();
builder.Services.AddScoped<IQuizImportService, QuizImportService>();
// Database
var connStr = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? builder.Configuration.GetConnectionString("LocalConnection")
    ?? "Data Source=quiznova.db";

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (connStr.Contains("Data Source=", StringComparison.OrdinalIgnoreCase) ||
        connStr.Contains(".db", StringComparison.OrdinalIgnoreCase))
    {
        options.UseSqlite(connStr);
    }
    else
    {
        options.UseNpgsql(connStr);
    }
});

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS
// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "https://quiznova-ai-eta.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// JWT
var jwtSettings = builder.Configuration.GetSection("Jwt");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtSettings["Key"]!)
                    )
            };
    });

builder.Services.AddAuthorization();
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.SetMinimumLevel(LogLevel.Debug);

var app = builder.Build();

app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[CRITICAL ERROR] {ex}");
        var origin = context.Request.Headers.Origin.ToString();
        context.Response.Headers.AccessControlAllowOrigin = string.IsNullOrEmpty(origin) ? "*" : origin;
        context.Response.Headers.AccessControlAllowCredentials = "true";
        context.Response.Headers.AccessControlAllowHeaders = "*";
        context.Response.Headers.AccessControlAllowMethods = "*";

        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";

        await context.Response.WriteAsJsonAsync(new
        {
            error = "Internal Server Error",
            message = ex.Message,
            innerError = ex.InnerException?.Message
        });
    }
});

// Ensure database is migrated and uploads directory exists
using (var scope = app.Services.CreateScope())
{
    // Ensure uploads directory exists
    var env = app.Services.GetRequiredService<IWebHostEnvironment>();
    var uploadPath = Path.Combine(env.ContentRootPath, "Uploads");
    if (!Directory.Exists(uploadPath))
    {
        Directory.CreateDirectory(uploadPath);
    }
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (db.Database.IsSqlite())
        {
            db.Database.EnsureCreated();
        }
        else
        {
            db.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Database migration failed. Ensure connection string is correct.");
    }
}

// Swagger
app.UseSwagger();
app.UseSwaggerUI();

app.UseRouting();

// CORS
app.UseCors("AllowFrontend");

// Auth
app.UseAuthentication();
app.UseAuthorization();
app.UseStaticFiles();
// Controllers
app.MapControllers();
app.MapHub<QuizHub>("/quizHub");

app.MapGet("/", () => "QuizNovaAI Backend Running");

app.Run();