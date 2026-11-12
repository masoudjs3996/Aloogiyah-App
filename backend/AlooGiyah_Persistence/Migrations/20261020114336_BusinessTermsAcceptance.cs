using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BusinessTermsAcceptance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BusinessTermsAcceptances",
                columns: table => new
                {
                    BusinessTermsAcceptanceId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BusinessApplicationId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    BusinessType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    TermsVersion = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    TermsHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    TermsSnapshot = table.Column<string>(type: "text", nullable: false),
                    AcceptedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessTermsAcceptances", x => x.BusinessTermsAcceptanceId);
                    table.ForeignKey(
                        name: "FK_BusinessTermsAcceptances_BusinessApplications_BusinessAppli~",
                        column: x => x.BusinessApplicationId,
                        principalTable: "BusinessApplications",
                        principalColumn: "BusinessApplicationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_BusinessTermsAcceptances_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessTermsAcceptances_BusinessApplicationId_AcceptedAt",
                table: "BusinessTermsAcceptances",
                columns: new[] { "BusinessApplicationId", "AcceptedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessTermsAcceptances_Code",
                table: "BusinessTermsAcceptances",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BusinessTermsAcceptances_UserId",
                table: "BusinessTermsAcceptances",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BusinessTermsAcceptances");
        }
    }
}
