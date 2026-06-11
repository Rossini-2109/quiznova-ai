using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddQuestionImage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "NumberOfQuestions",
                table: "Quizzes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "OptionAImageUrl",
                table: "Questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionBImageUrl",
                table: "Questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionCImageUrl",
                table: "Questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OptionDImageUrl",
                table: "Questions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionImageUrl",
                table: "Questions",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "NumberOfQuestions",
                table: "Quizzes");

            migrationBuilder.DropColumn(
                name: "OptionAImageUrl",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionBImageUrl",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionCImageUrl",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "OptionDImageUrl",
                table: "Questions");

            migrationBuilder.DropColumn(
                name: "QuestionImageUrl",
                table: "Questions");
        }
    }
}
