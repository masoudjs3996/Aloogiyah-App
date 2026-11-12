using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ProductSaleUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SaleUnit",
                table: "AgriculturalProducts",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SaleUnit",
                table: "AgriculturalOrderItems",
                type: "character varying(16)",
                maxLength: 16,
                nullable: true);

            migrationBuilder.AddCheckConstraint(
                name: "CK_AgriculturalProducts_SaleUnit",
                table: "AgriculturalProducts",
                sql: "\"SaleUnit\" IS NULL OR \"SaleUnit\" IN ('Kilogram','Package','Piece')");

            migrationBuilder.AddCheckConstraint(
                name: "CK_AgriculturalOrderItems_SaleUnit",
                table: "AgriculturalOrderItems",
                sql: "\"SaleUnit\" IS NULL OR \"SaleUnit\" IN ('Kilogram','Package','Piece')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM "AgriculturalProducts" WHERE "SaleUnit" IS NOT NULL)
                    OR EXISTS (SELECT 1 FROM "AgriculturalOrderItems" WHERE "SaleUnit" IS NOT NULL) THEN
                    RAISE EXCEPTION 'Sale unit records exist; preserve product and order units before downgrade.';
                  END IF;
                END $$;
                """);
            migrationBuilder.DropCheckConstraint(
                name: "CK_AgriculturalProducts_SaleUnit",
                table: "AgriculturalProducts");

            migrationBuilder.DropCheckConstraint(
                name: "CK_AgriculturalOrderItems_SaleUnit",
                table: "AgriculturalOrderItems");

            migrationBuilder.DropColumn(
                name: "SaleUnit",
                table: "AgriculturalProducts");

            migrationBuilder.DropColumn(
                name: "SaleUnit",
                table: "AgriculturalOrderItems");
        }
    }
}
