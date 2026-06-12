using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Betonator.Migrations
{
    /// <inheritdoc />
    public partial class InitialPostgres : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Competitions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    IsInternational = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Competitions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Username = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    Email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    IsAdmin = table.Column<bool>(type: "boolean", nullable: false),
                    IsDisabled = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false)
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

            migrationBuilder.CreateTable(
                name: "CompetitionParticipants",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompetitionParticipants", x => new { x.UserId, x.CompetitionId });
                    table.ForeignKey(
                        name: "FK_CompetitionParticipants_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompetitionParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Matches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CompetitionId = table.Column<int>(type: "integer", nullable: false),
                    GameTime = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Team1 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Team2 = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    Goal1 = table.Column<int>(type: "integer", nullable: true),
                    Goal2 = table.Column<int>(type: "integer", nullable: true),
                    Description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    ResultDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    GroupId = table.Column<int>(type: "integer", nullable: true),
                    Stage = table.Column<int>(type: "integer", nullable: true),
                    BracketPosition = table.Column<int>(type: "integer", nullable: false),
                    FeederMatch1Id = table.Column<int>(type: "integer", nullable: true),
                    FeederMatch2Id = table.Column<int>(type: "integer", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Matches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Matches_Competitions_CompetitionId",
                        column: x => x.CompetitionId,
                        principalTable: "Competitions",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Matches_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Matches_Matches_FeederMatch1Id",
                        column: x => x.FeederMatch1Id,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Matches_Matches_FeederMatch2Id",
                        column: x => x.FeederMatch2Id,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Bets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    MatchId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BetGoal1 = table.Column<int>(type: "integer", nullable: false),
                    BetGoal2 = table.Column<int>(type: "integer", nullable: false),
                    Points = table.Column<int>(type: "integer", nullable: true),
                    PlacedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "bytea", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Bets_Matches_MatchId",
                        column: x => x.MatchId,
                        principalTable: "Matches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Bets_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Bets_MatchId_UserId",
                table: "Bets",
                columns: new[] { "MatchId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bets_UserId",
                table: "Bets",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CompetitionParticipants_CompetitionId",
                table: "CompetitionParticipants",
                column: "CompetitionId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_CompetitionId_Name",
                table: "Groups",
                columns: new[] { "CompetitionId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Matches_CompetitionId_GameTime",
                table: "Matches",
                columns: new[] { "CompetitionId", "GameTime" });

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
                name: "IX_Users_Username",
                table: "Users",
                column: "Username",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bets");

            migrationBuilder.DropTable(
                name: "CompetitionParticipants");

            migrationBuilder.DropTable(
                name: "Matches");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropTable(
                name: "Competitions");
        }
    }
}
