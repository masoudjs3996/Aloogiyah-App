using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
namespace AlooGiyah_Persistence.Migrations;
[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261019120000_ChatMediaPreviews")]
public class ChatMediaPreviews : Migration
{
    protected override void Up(MigrationBuilder m) => m.AddColumn<string>("AttachmentPreview", "ChatMessages", type: "character varying(12000)", maxLength: 12000, nullable: true);
    protected override void Down(MigrationBuilder m) => m.DropColumn("AttachmentPreview", "ChatMessages");
}
