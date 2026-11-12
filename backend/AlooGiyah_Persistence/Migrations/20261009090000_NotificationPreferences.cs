using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261009090000_NotificationPreferences")]
public partial class NotificationPreferences : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "ReceiveGeneralNotifications",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "ReceiveOrderNotifications",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: true);

        migrationBuilder.AddColumn<bool>(
            name: "ReceiveServiceRequestNotifications",
            table: "Users",
            type: "boolean",
            nullable: false,
            defaultValue: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ReceiveGeneralNotifications", table: "Users");
        migrationBuilder.DropColumn(name: "ReceiveOrderNotifications", table: "Users");
        migrationBuilder.DropColumn(name: "ReceiveServiceRequestNotifications", table: "Users");
    }
}
