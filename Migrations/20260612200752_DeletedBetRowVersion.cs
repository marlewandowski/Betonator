using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Betonator.Migrations
{
    /// <inheritdoc />
    public partial class DeletedBetRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Bets");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "RowVersion",
                table: "Bets",
                type: "bytea",
                nullable: false,
                defaultValue: new byte[0]);
        }
    }
}
