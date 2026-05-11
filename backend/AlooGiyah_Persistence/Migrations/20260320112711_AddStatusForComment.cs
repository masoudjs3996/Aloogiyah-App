using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusForComment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {


            migrationBuilder.AddColumn<int>(
                name: "StatusId",
                table: "Comments",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Comments_StatusId",
                table: "Comments",
                column: "StatusId");

            migrationBuilder.AddForeignKey(
                name: "FK_Comments_Statuses_StatusId",
                table: "Comments",
                column: "StatusId",
                principalTable: "Statuses",
                principalColumn: "StatusId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Comments_Statuses_StatusId",
                table: "Comments");

            migrationBuilder.DropIndex(
                name: "IX_Comments_StatusId",
                table: "Comments");

            migrationBuilder.DropColumn(
                name: "StatusId",
                table: "Comments");
        }
    }
}
