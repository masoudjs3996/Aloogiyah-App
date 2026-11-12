using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261018180000_MapSearchCache")]
public class MapSearchCache : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        CREATE TABLE "MapSearchCache" (
          "Key" text PRIMARY KEY, "Payload" text NOT NULL, "ExpiresAt" timestamptz NOT NULL
        );
        CREATE TABLE "MapSearchGate" (
          "Id" integer PRIMARY KEY CHECK ("Id" = 1), "NextAllowedAt" timestamptz NOT NULL
        );
        INSERT INTO "MapSearchGate" VALUES (1, '1970-01-01');
        CREATE INDEX "IX_MapSearchCache_ExpiresAt" ON "MapSearchCache" ("ExpiresAt");
        """);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        DROP TABLE "MapSearchCache";
        DROP TABLE "MapSearchGate";
        """);
}
