using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    public partial class ConvertTimeLimitToSeconds : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Multiply existing TimeLimit values by 60 (minutes → seconds)
            migrationBuilder.Sql(
                "UPDATE \"Quizzes\" SET \"TimeLimit\" = \"TimeLimit\" * 60 WHERE \"TimeLimit\" IS NOT NULL;"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert by dividing by 60 (integer division)
            migrationBuilder.Sql(
                "UPDATE \"Quizzes\" SET \"TimeLimit\" = \"TimeLimit\" / 60 WHERE \"TimeLimit\" IS NOT NULL;"
            );
        }
    }
}
