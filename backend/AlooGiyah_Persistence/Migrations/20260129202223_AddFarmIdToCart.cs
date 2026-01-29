using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddFarmIdToCart : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FarmId",
                table: "Carts",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GuestId",
                table: "Carts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Carts_FarmId",
                table: "Carts",
                column: "FarmId");

            migrationBuilder.AddForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts",
                column: "FarmId",
                principalTable: "Farms",
                principalColumn: "FarmId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Carts_Farms_FarmId",
                table: "Carts");

            migrationBuilder.DropIndex(
                name: "IX_Carts_FarmId",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "FarmId",
                table: "Carts");

            migrationBuilder.DropColumn(
                name: "GuestId",
                table: "Carts");
        }
    }
}
