using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261007150000_AddAddressToServiceRequest")]
public partial class AddAddressToServiceRequest : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<int>(
            name: "AddressId",
            table: "ServiceRequests",
            type: "integer",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_ServiceRequests_AddressId",
            table: "ServiceRequests",
            column: "AddressId");

        migrationBuilder.AddForeignKey(
            name: "FK_ServiceRequests_Addresses_AddressId",
            table: "ServiceRequests",
            column: "AddressId",
            principalTable: "Addresses",
            principalColumn: "AddressId",
            onDelete: ReferentialAction.Restrict);

        migrationBuilder.Sql("""
            INSERT INTO "Statuses" ("Code", "Name", "Description", "EntityStatus", "CreatedAt", "UpdatedAt", "IsDeleted")
            SELECT 'SRVPEND001', 'در انتظار بررسی', 'درخواست خدمات تازه ثبت‌شده', 2, NOW(), NULL, FALSE
            WHERE NOT EXISTS (
                SELECT 1 FROM "Statuses"
                WHERE "EntityStatus" = 2 AND NOT "IsDeleted"
                  AND ("Code" = 'Pending' OR "Name" ILIKE '%انتظار%' OR "Name" ILIKE '%pending%')
            );
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_ServiceRequests_Addresses_AddressId", table: "ServiceRequests");
        migrationBuilder.DropIndex(name: "IX_ServiceRequests_AddressId", table: "ServiceRequests");
        migrationBuilder.DropColumn(name: "AddressId", table: "ServiceRequests");
    }
}
