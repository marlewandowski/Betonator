using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Betonator.Data.Migrations
{
    /// <inheritdoc />
    public partial class GroupsAndBracket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BracketPosition",
                table: "Matches",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "FeederMatch1Id",
                table: "Matches",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "FeederMatch2Id",
                table: "Matches",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "GroupId",
                table: "Matches",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Stage",
                table: "Matches",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CompetitionId = table.Column<int>(type: "INTEGER", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 64, nullable: false),
                    DisplayOrder = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groups_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_CompetitionId_Stage_BracketPosition",
                table: "Matches",
                columns: new[] { "CompetitionId", "Stage", "BracketPosition" });

            migrationBuilder.CreateIndex(
                name: "IX_Matches_FeederMatch1Id",
                table: "Matches",
                column: "FeederMatch1Id");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_FeederMatch2Id",
                table: "Matches",
                column: "FeederMatch2Id");

            migrationBuilder.CreateIndex(
                name: "IX_Matches_GroupId",
                table: "Matches",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_CompetitionId_Name",
                table: "Groups",
                columns: new[] { "CompetitionId", "Name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_Groups_GroupId",
                table: "Matches",
                column: "GroupId",
                principalTable: "Groups",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_Matches_FeederMatch1Id",
                table: "Matches",
                column: "FeederMatch1Id",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Matches_Matches_FeederMatch2Id",
                table: "Matches",
                column: "FeederMatch2Id",
                principalTable: "Matches",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Matches_Groups_GroupId",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_Matches_FeederMatch1Id",
                table: "Matches");

            migrationBuilder.DropForeignKey(
                name: "FK_Matches_Matches_FeederMatch2Id",
                table: "Matches");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropIndex(
                name: "IX_Matches_CompetitionId_Stage_BracketPosition",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_FeederMatch1Id",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_FeederMatch2Id",
                table: "Matches");

            migrationBuilder.DropIndex(
                name: "IX_Matches_GroupId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "BracketPosition",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "FeederMatch1Id",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "FeederMatch2Id",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "GroupId",
                table: "Matches");

            migrationBuilder.DropColumn(
                name: "Stage",
                table: "Matches");
        }
    }
}
