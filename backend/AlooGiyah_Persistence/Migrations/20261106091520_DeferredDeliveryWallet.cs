using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DeferredDeliveryWallet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeferred",
                table: "DeliveryLegs",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "DeferredFeeLimit",
                table: "DeliveryBookings",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DeferredFeePaid",
                table: "DeliveryBookings",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "HeldDeliveryFee",
                table: "DeliveryBookings",
                type: "numeric(20,2)",
                precision: 20,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddCheckConstraint(
                name: "CK_DeliveryBookings_DeferredFunds",
                table: "DeliveryBookings",
                sql: "(\"DeferredFeeLimit\" IS NULL OR \"DeferredFeeLimit\" > 0) AND \"HeldDeliveryFee\" >= 0 AND (\"DeferredFeeLimit\" IS NOT NULL OR \"HeldDeliveryFee\" = 0) AND (\"DeferredFeePaid\" IS NULL OR (\"DeferredFeePaid\" >= 0 AND \"HeldDeliveryFee\" = 0))");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM "DeliveryBookings" WHERE "DeferredFeeLimit" IS NOT NULL) THEN
                    RAISE EXCEPTION 'Deferred shipping agreements exist; reconcile and preserve their financial records before downgrade.';
                  END IF;
                END $$;
                """);
            migrationBuilder.DropCheckConstraint(
                name: "CK_DeliveryBookings_DeferredFunds",
                table: "DeliveryBookings");

            migrationBuilder.DropColumn(
                name: "IsDeferred",
                table: "DeliveryLegs");

            migrationBuilder.DropColumn(
                name: "DeferredFeeLimit",
                table: "DeliveryBookings");

            migrationBuilder.DropColumn(
                name: "DeferredFeePaid",
                table: "DeliveryBookings");

            migrationBuilder.DropColumn(
                name: "HeldDeliveryFee",
                table: "DeliveryBookings");
        }
    }
}
