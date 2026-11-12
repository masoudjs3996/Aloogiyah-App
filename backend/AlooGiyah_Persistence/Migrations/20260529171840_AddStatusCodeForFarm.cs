using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusCodeForFarm : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Farms",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Farms_StatusId",
                table: "Farms",
                column: "StatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_Farms_Statuses_StatusId",
                table: "Farms",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Farms_Statuses_StatusId",
                table: "Farms");

            migrationBuilder.DropIndex(
                name: "IX_Farms_StatusId",
                table: "Farms");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Farms");
        }
    }
}
