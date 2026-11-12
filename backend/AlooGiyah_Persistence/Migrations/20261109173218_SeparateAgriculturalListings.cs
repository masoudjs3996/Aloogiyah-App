using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SeparateAgriculturalListings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalProducts_AgriculturalProductTemplates_Agricultu~",
                table: "AgriculturalProducts");

            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalProductSpecificationValues_AgriculturalProducts~",
                table: "AgriculturalProductSpecificationValues");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductInquiries_AgriculturalProducts_ProductId",
                table: "ProductInquiries");

            migrationBuilder.DropForeignKey(
                name: "FK_ProductReports_AgriculturalProducts_ProductId",
                table: "ProductReports");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalProducts_AgriculturalProductTemplateId",
                table: "AgriculturalProducts");

            migrationBuilder.RenameColumn(
                name: "ProductId",
                table: "ProductInquiries",
                newName: "ListingId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductInquiries_ProductId",
                table: "ProductInquiries",
                newName: "IX_ProductInquiries_ListingId");

            migrationBuilder.RenameIndex(
                name: "IX_ProductInquiries_BuyerId_ProductId_Status",
                table: "ProductInquiries",
                newName: "IX_ProductInquiries_BuyerId_ListingId_Status");

            migrationBuilder.RenameColumn(
                name: "AgriculturalProductId",
                table: "AgriculturalProductSpecificationValues",
                newName: "AgriculturalListingId");

            migrationBuilder.CreateTable(
                name: "AgriculturalListings",
                columns: table => new
                {
                    AgriculturalListingId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FarmId = table.Column<int>(type: "integer", nullable: false),
                    AgriculturalProductTemplateId = table.Column<int>(type: "integer", nullable: true),
                    LegacyProductCode = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    Name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Slug = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SaleUnit = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    RetailPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    WholesalePrice = table.Column<decimal>(type: "numeric", nullable: true),
                    Stock = table.Column<int>(type: "integer", nullable: false),
                    DailyProductionCapacity = table.Column<int>(type: "integer", nullable: true),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false),
                    ImageUrls = table.Column<List<string>>(type: "text[]", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalListings", x => x.AgriculturalListingId);
                    table.ForeignKey(
                        name: "FK_AgriculturalListings_AgriculturalProductTemplates_Agricultu~",
                        column: x => x.AgriculturalProductTemplateId,
                        principalTable: "AgriculturalProductTemplates",
                        principalColumn: "AgriculturalProductTemplateId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AgriculturalListings_Farms_FarmId",
                        column: x => x.FarmId,
                        principalTable: "Farms",
                        principalColumn: "FarmId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SavedListings",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    ListingId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedListings", x => new { x.UserId, x.ListingId });
                    table.ForeignKey(
                        name: "FK_SavedListings_AgriculturalListings_ListingId",
                        column: x => x.ListingId,
                        principalTable: "AgriculturalListings",
                        principalColumn: "AgriculturalListingId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SavedListings_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgriculturalListingCategory",
                columns: table => new
                {
                    ListingId = table.Column<int>(type: "integer", nullable: false),
                    CategoryId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalListingCategory", x => new { x.ListingId, x.CategoryId });
                    table.ForeignKey("FK_AgriculturalListingCategory_AgriculturalListings_ListingId",
                        x => x.ListingId, "AgriculturalListings", "AgriculturalListingId", onDelete: ReferentialAction.Cascade);
                    table.ForeignKey("FK_AgriculturalListingCategory_Categories_CategoryId",
                        x => x.CategoryId, "Categories", "CategoryId", onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex("IX_AgriculturalListingCategory_CategoryId", "AgriculturalListingCategory", "CategoryId");

            migrationBuilder.Sql("""
                CREATE TRIGGER "TR_ReserveEntityCode_AgriculturalListings"
                BEFORE INSERT OR UPDATE ON "AgriculturalListings"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();

                INSERT INTO "AgriculturalListings"
                    ("AgriculturalListingId", "FarmId", "AgriculturalProductTemplateId", "LegacyProductCode",
                     "Name", "Description", "Slug", "SaleUnit", "RetailPrice", "WholesalePrice", "Stock",
                     "DailyProductionCapacity", "IsPublished", "ImageUrls", "Code", "CreatedAt", "UpdatedAt", "IsDeleted")
                SELECT p."AgriculturalProductId", p."FarmId", p."AgriculturalProductTemplateId", p."Code",
                       p."Name", p."Description", p."Slug", p."SaleUnit", p."RetailPrice", p."WholesalePrice", p."Stock",
                       p."DailyProductionCapacity", s."Code" = '251BC4A57D' AND NOT s."IsDeleted",
                       ARRAY(SELECT f."Url" FROM "Files" f
                             WHERE f."EntityCode" = p."Code" AND f."EntityFile" = 3 AND NOT f."IsDeleted"
                             ORDER BY f."IsPrimary" DESC, f."CreatedAt", f."FileId"),
                       upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
                       p."CreatedAt", p."UpdatedAt", p."IsDeleted"
                FROM "AgriculturalProducts" p
                JOIN "Statuses" s ON s."StatusId" = p."StatusId";

                SELECT setval(pg_get_serial_sequence('"AgriculturalListings"', 'AgriculturalListingId'),
                              COALESCE(MAX("AgriculturalListingId"), 1), COUNT(*) > 0)
                FROM "AgriculturalListings";

                INSERT INTO "AgriculturalListingCategory" ("ListingId", "CategoryId")
                SELECT "AgriculturalProductsAgriculturalProductId", "CategoriesCategoryId"
                FROM "AgriculturalProductCategory";

                INSERT INTO "SavedListings" ("UserId", "ListingId", "CreatedAt")
                SELECT "UserId", "AgriculturalProductId", "CreatedAt" FROM "SavedProducts" WHERE NOT "IsDeleted";

                CREATE TEMP TABLE listing_comment_ids ON COMMIT DROP AS
                SELECT c."CommentId" AS old_id,
                       nextval(pg_get_serial_sequence('"Comments"', 'CommentId'))::integer AS new_id,
                       l."Code" AS listing_code
                FROM "Comments" c JOIN "AgriculturalListings" l ON l."LegacyProductCode" = c."EntityCode"
                WHERE c."EntityComment" = 2;

                INSERT INTO "Comments" ("CommentId", "Code", "Content", "CreatedAt", "UpdatedAt", "EntityCode",
                    "EntityComment", "IsDeleted", "IsUniqueProductReview", "ParentCommentId", "Rating", "StatusId", "UserId")
                SELECT ids.new_id, upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
                       c."Content", c."CreatedAt", c."UpdatedAt", ids.listing_code, 6, c."IsDeleted",
                       c."IsUniqueProductReview", parent.new_id, c."Rating", c."StatusId", c."UserId"
                FROM listing_comment_ids ids JOIN "Comments" c ON c."CommentId" = ids.old_id
                LEFT JOIN listing_comment_ids parent ON parent.old_id = c."ParentCommentId";
                """);

            migrationBuilder.DropColumn(
                name: "AgriculturalProductTemplateId",
                table: "AgriculturalProducts");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalListings_AgriculturalProductTemplateId",
                table: "AgriculturalListings",
                column: "AgriculturalProductTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalListings_Code",
                table: "AgriculturalListings",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalListings_FarmId",
                table: "AgriculturalListings",
                column: "FarmId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalListings_LegacyProductCode",
                table: "AgriculturalListings",
                column: "LegacyProductCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SavedListings_ListingId",
                table: "SavedListings",
                column: "ListingId");

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalProductSpecificationValues_AgriculturalListings~",
                table: "AgriculturalProductSpecificationValues",
                column: "AgriculturalListingId",
                principalTable: "AgriculturalListings",
                principalColumn: "AgriculturalListingId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductInquiries_AgriculturalListings_ListingId",
                table: "ProductInquiries",
                column: "ListingId",
                principalTable: "AgriculturalListings",
                principalColumn: "AgriculturalListingId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ProductReports_AgriculturalListings_ProductId",
                table: "ProductReports",
                column: "ProductId",
                principalTable: "AgriculturalListings",
                principalColumn: "AgriculturalListingId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            throw new NotSupportedException("Restore a pre-migration backup to roll back listing separation without discarding data.");
        }
    }
}
