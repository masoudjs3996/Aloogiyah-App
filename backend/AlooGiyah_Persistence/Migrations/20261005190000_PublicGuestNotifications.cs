using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261005190000_PublicGuestNotifications")]
public partial class PublicGuestNotifications : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AlterColumn<int>(
            name: "UserId",
            table: "Notifications",
            type: "integer",
            nullable: true,
            oldClrType: typeof(int),
            oldType: "integer");

        migrationBuilder.AddColumn<bool>(
            name: "IsPublic",
            table: "Notifications",
            type: "boolean",
            nullable: false,
            defaultValue: false);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DO $$
            BEGIN
                IF EXISTS (SELECT 1 FROM "Notifications" WHERE "UserId" IS NULL) THEN
                    RAISE EXCEPTION 'Cannot downgrade while public notifications exist.';
                END IF;
            END $$;
            """);

        migrationBuilder.DropColumn(
            name: "IsPublic",
            table: "Notifications");

        migrationBuilder.AlterColumn<int>(
            name: "UserId",
            table: "Notifications",
            type: "integer",
            nullable: false,
            oldClrType: typeof(int),
            oldType: "integer",
            oldNullable: true);
    }
}
