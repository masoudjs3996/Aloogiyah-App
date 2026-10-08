using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261008120000_AddChatConversations")]
public partial class AddChatConversations : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "ChatConversations",
            columns: table => new
            {
                ChatConversationId = table.Column<int>(type: "integer", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                ParticipantOneId = table.Column<int>(type: "integer", nullable: false),
                ParticipantTwoId = table.Column<int>(type: "integer", nullable: false),
                LastMessageAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_ChatConversations", x => x.ChatConversationId);
                table.ForeignKey("FK_ChatConversations_Users_ParticipantOneId", x => x.ParticipantOneId, "Users", "UserId", onDelete: ReferentialAction.Restrict);
                table.ForeignKey("FK_ChatConversations_Users_ParticipantTwoId", x => x.ParticipantTwoId, "Users", "UserId", onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.Sql("""
            INSERT INTO "ChatConversations" ("ParticipantOneId", "ParticipantTwoId", "LastMessageAt", "Code", "CreatedAt", "UpdatedAt", "IsDeleted")
            SELECT pairs."ParticipantOneId", pairs."ParticipantTwoId", pairs."LastMessageAt",
                   upper(substr(md5(random()::text || clock_timestamp()::text || pairs."ParticipantOneId"::text || pairs."ParticipantTwoId"::text), 1, 10)),
                   pairs."CreatedAt", NULL, false
            FROM (
                SELECT LEAST("SenderId", "ReceiverId") AS "ParticipantOneId",
                       GREATEST("SenderId", "ReceiverId") AS "ParticipantTwoId",
                       MAX("CreatedAt") AS "LastMessageAt", MIN("CreatedAt") AS "CreatedAt"
                FROM "ChatMessages"
                GROUP BY LEAST("SenderId", "ReceiverId"), GREATEST("SenderId", "ReceiverId")
            ) pairs;
            """);
        migrationBuilder.Sql("""
            INSERT INTO "EntityCodeRegistry" ("Code", "EntityType", "CreatedAt")
            SELECT "Code", 'ChatConversations', "CreatedAt" FROM "ChatConversations";
            CREATE TRIGGER "TR_ReserveEntityCode_ChatConversations"
            BEFORE INSERT OR UPDATE ON "ChatConversations"
            FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
            """);

        migrationBuilder.AddColumn<int>(name: "ConversationId", table: "ChatMessages", type: "integer", nullable: true);
        migrationBuilder.AddColumn<bool>(name: "IsEdited", table: "ChatMessages", type: "boolean", nullable: false, defaultValue: false);
        migrationBuilder.AddColumn<DateTimeOffset>(name: "EditedAt", table: "ChatMessages", type: "timestamp with time zone", nullable: true);
        migrationBuilder.Sql("""
            UPDATE "ChatMessages" m SET "ConversationId" = c."ChatConversationId"
            FROM "ChatConversations" c
            WHERE c."ParticipantOneId" = LEAST(m."SenderId", m."ReceiverId")
              AND c."ParticipantTwoId" = GREATEST(m."SenderId", m."ReceiverId");
            """);
        migrationBuilder.AlterColumn<int>(name: "ConversationId", table: "ChatMessages", type: "integer", nullable: false, oldClrType: typeof(int), oldType: "integer", oldNullable: true);
        migrationBuilder.CreateIndex(name: "IX_ChatConversations_Code", table: "ChatConversations", column: "Code", unique: true);
        migrationBuilder.CreateIndex(name: "IX_ChatConversations_ParticipantOneId_ParticipantTwoId", table: "ChatConversations", columns: new[] { "ParticipantOneId", "ParticipantTwoId" }, unique: true);
        migrationBuilder.CreateIndex(name: "IX_ChatConversations_ParticipantTwoId", table: "ChatConversations", column: "ParticipantTwoId");
        migrationBuilder.CreateIndex(name: "IX_ChatMessages_ConversationId_CreatedAt", table: "ChatMessages", columns: new[] { "ConversationId", "CreatedAt" });
        migrationBuilder.AddForeignKey(name: "FK_ChatMessages_ChatConversations_ConversationId", table: "ChatMessages", column: "ConversationId", principalTable: "ChatConversations", principalColumn: "ChatConversationId", onDelete: ReferentialAction.Restrict);

        migrationBuilder.CreateTable(name: "ChatConversationBlocks", columns: table => new
        {
            ChatConversationBlockId = table.Column<int>(type: "integer", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            ConversationId = table.Column<int>(type: "integer", nullable: false),
            BlockedByUserId = table.Column<int>(type: "integer", nullable: false),
            BlockedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_ChatConversationBlocks", x => x.ChatConversationBlockId);
            table.ForeignKey("FK_ChatConversationBlocks_ChatConversations_ConversationId", x => x.ConversationId, "ChatConversations", "ChatConversationId", onDelete: ReferentialAction.Restrict);
            table.ForeignKey("FK_ChatConversationBlocks_Users_BlockedByUserId", x => x.BlockedByUserId, "Users", "UserId", onDelete: ReferentialAction.Restrict);
        });
        migrationBuilder.CreateTable(name: "ChatMessageAttachments", columns: table => new
        {
            ChatMessageAttachmentId = table.Column<int>(type: "integer", nullable: false).Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
            ChatMessageId = table.Column<int>(type: "integer", nullable: false),
            FileId = table.Column<int>(type: "integer", nullable: false),
            FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
            ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
            SizeInBytes = table.Column<long>(type: "bigint", nullable: false),
            Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
            CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
            UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
            IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
        }, constraints: table =>
        {
            table.PrimaryKey("PK_ChatMessageAttachments", x => x.ChatMessageAttachmentId);
            table.ForeignKey("FK_ChatMessageAttachments_ChatMessages_ChatMessageId", x => x.ChatMessageId, "ChatMessages", "ChatMessageId", onDelete: ReferentialAction.Restrict);
            table.ForeignKey("FK_ChatMessageAttachments_Files_FileId", x => x.FileId, "Files", "FileId", onDelete: ReferentialAction.Restrict);
        });
        migrationBuilder.CreateIndex("IX_ChatConversationBlocks_Code", "ChatConversationBlocks", "Code", unique: true);
        migrationBuilder.CreateIndex("IX_ChatConversationBlocks_ConversationId_BlockedByUserId", "ChatConversationBlocks", new[] { "ConversationId", "BlockedByUserId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ChatConversationBlocks_BlockedByUserId", "ChatConversationBlocks", "BlockedByUserId");
        migrationBuilder.CreateIndex("IX_ChatMessageAttachments_Code", "ChatMessageAttachments", "Code", unique: true);
        migrationBuilder.CreateIndex("IX_ChatMessageAttachments_ChatMessageId_FileId", "ChatMessageAttachments", new[] { "ChatMessageId", "FileId" }, unique: true);
        migrationBuilder.CreateIndex("IX_ChatMessageAttachments_FileId", "ChatMessageAttachments", "FileId");
        migrationBuilder.Sql("""
            CREATE TRIGGER "TR_ReserveEntityCode_ChatConversationBlocks" BEFORE INSERT OR UPDATE ON "ChatConversationBlocks" FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
            CREATE TRIGGER "TR_ReserveEntityCode_ChatMessageAttachments" BEFORE INSERT OR UPDATE ON "ChatMessageAttachments" FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("""
            DROP TRIGGER IF EXISTS "TR_ReserveEntityCode_ChatConversationBlocks" ON "ChatConversationBlocks";
            DROP TRIGGER IF EXISTS "TR_ReserveEntityCode_ChatMessageAttachments" ON "ChatMessageAttachments";
            DELETE FROM "EntityCodeRegistry" WHERE "EntityType" IN ('ChatConversationBlocks', 'ChatMessageAttachments');
            """);
        migrationBuilder.DropTable(name: "ChatConversationBlocks");
        migrationBuilder.DropTable(name: "ChatMessageAttachments");
        migrationBuilder.Sql("""
            DROP TRIGGER IF EXISTS "TR_ReserveEntityCode_ChatConversations" ON "ChatConversations";
            DELETE FROM "EntityCodeRegistry" WHERE "EntityType" = 'ChatConversations';
            """);
        migrationBuilder.DropForeignKey(name: "FK_ChatMessages_ChatConversations_ConversationId", table: "ChatMessages");
        migrationBuilder.DropIndex(name: "IX_ChatMessages_ConversationId_CreatedAt", table: "ChatMessages");
        migrationBuilder.DropColumn(name: "ConversationId", table: "ChatMessages");
        migrationBuilder.DropColumn(name: "IsEdited", table: "ChatMessages");
        migrationBuilder.DropColumn(name: "EditedAt", table: "ChatMessages");
        migrationBuilder.DropTable(name: "ChatConversations");
    }
}
