using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AccountPhoneVerification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPhoneConfirmed",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "RequestedByUserId",
                table: "PhoneOtpChallenges",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Users"
                SET "IsPhoneConfirmed" = TRUE
                WHERE NOT "IsDeleted" AND "PhoneNumber" ~ '^09[0-9]{9}$'
                  AND "UserName" = 'phone_' || "PhoneNumber";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users",
                column: "PhoneNumber",
                unique: true,
                filter: "\"IsPhoneConfirmed\" AND NOT \"IsDeleted\" AND \"PhoneNumber\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PhoneOtpChallenges_RequestedByUserId",
                table: "PhoneOtpChallenges",
                column: "RequestedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PhoneOtpChallenges_Users_RequestedByUserId",
                table: "PhoneOtpChallenges",
                column: "RequestedByUserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PhoneOtpChallenges_Users_RequestedByUserId",
                table: "PhoneOtpChallenges");

            migrationBuilder.DropIndex(
                name: "IX_Users_PhoneNumber",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_PhoneOtpChallenges_RequestedByUserId",
                table: "PhoneOtpChallenges");

            migrationBuilder.DropColumn(
                name: "IsPhoneConfirmed",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RequestedByUserId",
                table: "PhoneOtpChallenges");
        }
    }
}
