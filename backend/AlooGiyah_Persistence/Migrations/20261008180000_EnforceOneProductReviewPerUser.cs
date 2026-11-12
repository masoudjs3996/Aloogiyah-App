using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261008180000_EnforceOneProductReviewPerUser")]
public partial class EnforceOneProductReviewPerUser : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<bool>(
            name: "IsUniqueProductReview",
            table: "Comments",
            type: "boolean",
            nullable: false,
            defaultValue: false);

        // Preserve existing reviews, including historical duplicates. Designate one
        // existing root review per user/product so new writes remain uniquely guarded.
        migrationBuilder.Sql("""
            WITH ranked_reviews AS (
                SELECT "CommentId",
                       ROW_NUMBER() OVER (
                           PARTITION BY "UserId", "EntityCode"
                           ORDER BY "CreatedAt", "CommentId"
                       ) AS position
                FROM "Comments"
                WHERE "EntityComment" = 2
                  AND "ParentCommentId" IS NULL
                  AND NOT "IsDeleted"
            )
            UPDATE "Comments" c
            SET "IsUniqueProductReview" = true
            FROM ranked_reviews r
            WHERE c."CommentId" = r."CommentId" AND r.position = 1;
            """);

        migrationBuilder.CreateIndex(
            name: "IX_Comments_UserId_EntityCode_ProductReview",
            table: "Comments",
            columns: new[] { "UserId", "EntityCode" },
            unique: true,
            filter: "\"IsUniqueProductReview\" AND \"ParentCommentId\" IS NULL AND NOT \"IsDeleted\"");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_Comments_UserId_EntityCode_ProductReview",
            table: "Comments");

        migrationBuilder.DropColumn(name: "IsUniqueProductReview", table: "Comments");
    }
}
