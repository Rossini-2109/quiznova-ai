using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class FixSessionId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Completed",
                table: "QuizAttempts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "QuizAttempts",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmployeeId",
                table: "QuizAttempts",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Rank",
                table: "QuizAttempts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "SessionId",
                table: "QuizAttempts",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TimeTakenSeconds",
                table: "QuizAttempts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_QuizAttempts_SessionId",
                table: "QuizAttempts",
                column: "SessionId");

            migrationBuilder.AddForeignKey(
                name: "FK_QuizAttempts_Sessions_SessionId",
                table: "QuizAttempts",
                column: "SessionId",
                principalTable: "Sessions",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QuizAttempts_Sessions_SessionId",
                table: "QuizAttempts");

            migrationBuilder.DropIndex(
                name: "IX_QuizAttempts_SessionId",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "Completed",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "EmployeeId",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "Rank",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "SessionId",
                table: "QuizAttempts");

            migrationBuilder.DropColumn(
                name: "TimeTakenSeconds",
                table: "QuizAttempts");
        }
    }
}
