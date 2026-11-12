using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace AlooGiyah_Persistence.Migrations;
[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261017200000_ChatFileMessages")]
public class ChatFileMessages : Migration
{
    protected override void Up(MigrationBuilder m) {
        m.AddColumn<string>("AttachmentKey", "ChatMessages", type: "character varying(100)", maxLength: 100, nullable: true);
        m.AddColumn<string>("AttachmentName", "ChatMessages", type: "character varying(255)", maxLength: 255, nullable: true);
        m.AddColumn<string>("AttachmentType", "ChatMessages", type: "character varying(150)", maxLength: 150, nullable: true);
        m.AddColumn<long>("AttachmentSize", "ChatMessages", type: "bigint", nullable: true);
    }
    protected override void Down(MigrationBuilder m) {
        foreach(var name in new[]{"AttachmentKey", "AttachmentName", "AttachmentType", "AttachmentSize"}) m.DropColumn(name, "ChatMessages");
    }
}
