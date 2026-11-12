using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class QualityAssessmentPaymentsAndSavedProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QualityAssessments_ApplicantId",
                table: "QualityAssessments");

            migrationBuilder.AddColumn<int>(
                name: "AgriculturalOrderId",
                table: "QualityAssessments",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountAmount",
                table: "QualityAssessments",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "Fee",
                table: "QualityAssessments",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "QualityAssessments",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PaidAmount",
                table: "QualityAssessments",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "PaidAt",
                table: "QualityAssessments",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReportFileUrl",
                table: "QualityAssessments",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestDescription",
                table: "QualityAssessments",
                type: "character varying(700)",
                maxLength: 700,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RequestHash",
                table: "QualityAssessments",
                type: "character varying(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RequestedQuantity",
                table: "QualityAssessments",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ForQualityAssessment",
                table: "Discounts",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "QualityAssessmentTariffs",
                columns: table => new
                {
                    QualityAssessmentTariffId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Fee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QualityAssessmentTariffs", x => x.QualityAssessmentTariffId);
                });

            migrationBuilder.Sql("""
                INSERT INTO "QualityAssessmentTariffs" ("Fee", "Code", "CreatedAt", "IsDeleted")
                VALUES (1500000, 'QLTF150000', CURRENT_TIMESTAMP, false);
                """);

            migrationBuilder.CreateTable(
                name: "SavedProducts",
                columns: table => new
                {
                    SavedProductId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    AgriculturalProductId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedProducts", x => x.SavedProductId);
                    table.ForeignKey(
                        name: "FK_SavedProducts_AgriculturalProducts_AgriculturalProductId",
                        column: x => x.AgriculturalProductId,
                        principalTable: "AgriculturalProducts",
                        principalColumn: "AgriculturalProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedProducts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QualityAssessments_AgriculturalOrderId",
                table: "QualityAssessments",
                column: "AgriculturalOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_QualityAssessments_ApplicantId_IdempotencyKey",
                table: "QualityAssessments",
                columns: new[] { "ApplicantId", "IdempotencyKey" },
                unique: true,
                filter: "\"IdempotencyKey\" IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_QualityAssessmentTariffs_Code",
                table: "QualityAssessmentTariffs",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedProducts_AgriculturalProductId",
                table: "SavedProducts",
                column: "AgriculturalProductId");

            migrationBuilder.CreateIndex(
                name: "IX_SavedProducts_Code",
                table: "SavedProducts",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedProducts_UserId_AgriculturalProductId",
                table: "SavedProducts",
                columns: new[] { "UserId", "AgriculturalProductId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QualityAssessments_AgriculturalOrders_AgriculturalOrderId",
                table: "QualityAssessments",
                column: "AgriculturalOrderId",
                principalTable: "AgriculturalOrders",
                principalColumn: "AgriculturalOrderId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QualityAssessments_AgriculturalOrders_AgriculturalOrderId",
                table: "QualityAssessments");

            migrationBuilder.DropTable(
                name: "QualityAssessmentTariffs");

            migrationBuilder.DropTable(
                name: "SavedProducts");

            migrationBuilder.DropIndex(
                name: "IX_QualityAssessments_AgriculturalOrderId",
                table: "QualityAssessments");

            migrationBuilder.DropIndex(
                name: "IX_QualityAssessments_ApplicantId_IdempotencyKey",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "AgriculturalOrderId",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "DiscountAmount",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "Fee",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "PaidAmount",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "PaidAt",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "ReportFileUrl",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "RequestDescription",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "RequestHash",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "RequestedQuantity",
                table: "QualityAssessments");

            migrationBuilder.DropColumn(
                name: "ForQualityAssessment",
                table: "Discounts");

            migrationBuilder.CreateIndex(
                name: "IX_QualityAssessments_ApplicantId",
                table: "QualityAssessments",
                column: "ApplicantId");
        }
    }
}
