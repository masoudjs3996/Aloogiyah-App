using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261016120000_EnforceSingleActiveDefaultAddress")]
public partial class EnforceSingleActiveDefaultAddress : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            LOCK TABLE "Addresses" IN SHARE ROW EXCLUSIVE MODE;
            DROP INDEX IF EXISTS "IX_Addresses_UserId_IsDefault";
            WITH ranked_defaults AS (
                SELECT "AddressId", ROW_NUMBER() OVER (
                    PARTITION BY "UserId"
                    ORDER BY COALESCE("UpdatedAt", "CreatedAt") DESC, "AddressId" DESC
                ) AS position
                FROM "Addresses"
                WHERE "IsDefault" AND NOT "IsDeleted"
            )
            UPDATE "Addresses" address
            SET "IsDefault" = false
            FROM ranked_defaults ranked
            WHERE address."AddressId" = ranked."AddressId" AND ranked.position > 1;
            """);
        migrationBuilder.CreateIndex(
            name: "IX_Addresses_UserId_IsDefault",
            table: "Addresses",
            columns: new[] { "UserId", "IsDefault" },
            unique: true,
            filter: "\"IsDefault\" = true AND NOT \"IsDeleted\"");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Addresses_UserId_IsDefault", table: "Addresses");
        migrationBuilder.Sql("UPDATE \"Addresses\" SET \"IsDefault\" = false WHERE \"IsDeleted\" AND \"IsDefault\";");
        migrationBuilder.CreateIndex(
            name: "IX_Addresses_UserId_IsDefault",
            table: "Addresses",
            columns: new[] { "UserId", "IsDefault" },
            unique: true,
            filter: "\"IsDefault\" = true");
    }
}
