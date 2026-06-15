using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveSessionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CurrentQuestionIndex",
                table: "Sessions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPaused",
                table: "Sessions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartedAt",
                table: "Sessions",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "AverageTimeTakenMs",
                table: "SessionParticipants",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<int>(
                name: "CopyAttempts",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CorrectAnswers",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FullscreenExitCount",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "Score",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SkippedAnswers",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "SuspicionScore",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TabSwitchCount",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WindowBlurCount",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WrongAnswers",
                table: "SessionParticipants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SessionAnalytics",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TotalQuestions = table.Column<int>(type: "integer", nullable: false),
                    CorrectCount = table.Column<int>(type: "integer", nullable: false),
                    WrongCount = table.Column<int>(type: "integer", nullable: false),
                    SkippedCount = table.Column<int>(type: "integer", nullable: false),
                    AverageResponseTimeMs = table.Column<double>(type: "double precision", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionAnalytics", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionAnalytics_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SessionParticipantAnswers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SessionParticipantId = table.Column<Guid>(type: "uuid", nullable: false),
                    QuestionId = table.Column<Guid>(type: "uuid", nullable: false),
                    SelectedOption = table.Column<string>(type: "text", nullable: false),
                    IsCorrect = table.Column<bool>(type: "boolean", nullable: false),
                    TimeTakenMs = table.Column<int>(type: "integer", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SessionParticipantAnswers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SessionParticipantAnswers_Questions_QuestionId",
                        column: x => x.QuestionId,
                        principalTable: "Questions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionParticipantAnswers_SessionParticipants_SessionPartic~",
                        column: x => x.SessionParticipantId,
                        principalTable: "SessionParticipants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SessionParticipantAnswers_Sessions_SessionId",
                        column: x => x.SessionId,
                        principalTable: "Sessions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SessionAnalytics_SessionId",
                table: "SessionAnalytics",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionParticipantAnswers_QuestionId",
                table: "SessionParticipantAnswers",
                column: "QuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionParticipantAnswers_SessionId",
                table: "SessionParticipantAnswers",
                column: "SessionId");

            migrationBuilder.CreateIndex(
                name: "IX_SessionParticipantAnswers_SessionParticipantId",
                table: "SessionParticipantAnswers",
                column: "SessionParticipantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SessionAnalytics");

            migrationBuilder.DropTable(
                name: "SessionParticipantAnswers");

            migrationBuilder.DropColumn(
                name: "CurrentQuestionIndex",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "EndedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "IsPaused",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "StartedAt",
                table: "Sessions");

            migrationBuilder.DropColumn(
                name: "AverageTimeTakenMs",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "CopyAttempts",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "CorrectAnswers",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "FullscreenExitCount",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "Score",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "SkippedAnswers",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "SuspicionScore",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "TabSwitchCount",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "WindowBlurCount",
                table: "SessionParticipants");

            migrationBuilder.DropColumn(
                name: "WrongAnswers",
                table: "SessionParticipants");
        }
    }
}
