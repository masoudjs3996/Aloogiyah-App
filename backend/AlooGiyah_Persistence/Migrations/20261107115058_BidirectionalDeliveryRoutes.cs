using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class BidirectionalDeliveryRoutes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsBidirectional",
                table: "DeliveryRoutes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                    IF EXISTS (SELECT 1 FROM "DeliveryRoutes" WHERE "IsBidirectional") THEN
                        RAISE EXCEPTION 'Bidirectional routes exist; preserve their configuration before downgrade.';
                    END IF;
                END $$;
                """);
            migrationBuilder.DropColumn(
                name: "IsBidirectional",
                table: "DeliveryRoutes");
        }
    }
}
