using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class CategoryRouteTariffs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PricingMode",
                table: "DeliveryRoutes",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Flat");

            migrationBuilder.AddColumn<string>(
                name: "PricingDetailsJson",
                table: "DeliveryLegs",
                type: "text",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.CreateTable(
                name: "DeliveryCategoryTariffs",
                columns: table => new
                {
                    DeliveryCategoryTariffId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryRouteId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    SaleUnit = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    BlockSize = table.Column<int>(type: "integer", nullable: false),
                    PricePerBlock = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryCategoryTariffs", x => x.DeliveryCategoryTariffId);
                    table.CheckConstraint("CK_DeliveryCategoryTariffs_Price", "\"PricePerBlock\" BETWEEN 0 AND 1000000000");
                    table.CheckConstraint("CK_DeliveryCategoryTariffs_Size", "\"BlockSize\" > 0");
                    table.CheckConstraint("CK_DeliveryCategoryTariffs_Unit", "\"SaleUnit\" IN ('Kilogram','Package','Piece')");
                    table.ForeignKey(
                        name: "FK_DeliveryCategoryTariffs_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryCategoryTariffs_DeliveryRoutes_DeliveryRouteId",
                        column: x => x.DeliveryRouteId,
                        principalTable: "DeliveryRoutes",
                        principalColumn: "DeliveryRouteId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryRoutes_PricingMode",
                table: "DeliveryRoutes",
                sql: "\"PricingMode\" IN ('Flat', 'CategoryUnits')");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryCategoryTariffs_CategoryId",
                table: "DeliveryCategoryTariffs",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryCategoryTariffs_Code",
                table: "DeliveryCategoryTariffs",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryCategoryTariffs_DeliveryRouteId_CategoryId_SaleUnit",
                table: "DeliveryCategoryTariffs",
                columns: new[] { "DeliveryRouteId", "CategoryId", "SaleUnit" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM "DeliveryCategoryTariffs")
                    OR EXISTS (SELECT 1 FROM "DeliveryRoutes" WHERE "PricingMode" <> 'Flat')
                    OR EXISTS (SELECT 1 FROM "DeliveryLegs" WHERE "PricingDetailsJson" <> '[]') THEN
                    RAISE EXCEPTION 'Category route pricing records exist; preserve tariffs and shipment pricing before downgrade.';
                  END IF;
                END $$;
                """);
            migrationBuilder.DropTable(
                name: "DeliveryCategoryTariffs");

            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryRoutes_PricingMode",
                table: "DeliveryRoutes");

            migrationBuilder.DropColumn(
                name: "PricingMode",
                table: "DeliveryRoutes");

            migrationBuilder.DropColumn(
                name: "PricingDetailsJson",
                table: "DeliveryLegs");
        }
    }
}
