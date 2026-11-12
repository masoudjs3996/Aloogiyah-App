using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BackfillMissingSaleUnits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                UPDATE "AgriculturalProducts"
                SET "SaleUnit" = 'Kilogram'
                WHERE "SaleUnit" IS NULL OR btrim("SaleUnit") = '';

                UPDATE "AgriculturalOrderItems"
                SET "SaleUnit" = 'Kilogram'
                WHERE "SaleUnit" IS NULL OR btrim("SaleUnit") = '';
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Keep assigned units: a later edit or purchase may rely on them,
            // and previously missing values cannot be distinguished safely.
        }
    }
}
