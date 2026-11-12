using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AllowUnscheduledSettlementRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateOnly>(
                name: "ScheduledDate",
                table: "SettlementRequests",
                type: "date",
                nullable: true,
                oldClrType: typeof(DateOnly),
                oldType: "date");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM "SettlementRequests" WHERE "ScheduledDate" IS NULL) THEN
                    RAISE EXCEPTION 'Unscheduled settlement requests exist; confirm their calendar before downgrade.';
                  END IF;
                END $$;
                """);
            migrationBuilder.AlterColumn<DateOnly>(
                name: "ScheduledDate",
                table: "SettlementRequests",
                type: "date",
                nullable: false,
                oldClrType: typeof(DateOnly),
                oldType: "date",
                oldNullable: true);
        }
    }
}
