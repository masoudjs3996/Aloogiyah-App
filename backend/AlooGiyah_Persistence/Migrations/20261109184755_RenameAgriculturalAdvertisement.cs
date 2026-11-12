using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RenameAgriculturalAdvertisement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(name: "AgriculturalListings", newName: "AgriculturalAdvertisement");
            migrationBuilder.RenameIndex("IX_AgriculturalListings_LegacyProductCode",
                newName: "IX_AgriculturalAdvertisement_LegacyProductCode", table: "AgriculturalAdvertisement");
            migrationBuilder.RenameIndex("IX_AgriculturalListings_FarmId",
                newName: "IX_AgriculturalAdvertisement_FarmId", table: "AgriculturalAdvertisement");
            migrationBuilder.RenameIndex("IX_AgriculturalListings_Code",
                newName: "IX_AgriculturalAdvertisement_Code", table: "AgriculturalAdvertisement");
            migrationBuilder.RenameIndex("IX_AgriculturalListings_AgriculturalProductTemplateId",
                newName: "IX_AgriculturalAdvertisement_AgriculturalProductTemplateId", table: "AgriculturalAdvertisement");

            migrationBuilder.Sql("""
                ALTER TABLE "AgriculturalAdvertisement" RENAME CONSTRAINT "PK_AgriculturalListings" TO "PK_AgriculturalAdvertisement";
                ALTER TABLE "AgriculturalAdvertisement" RENAME CONSTRAINT "FK_AgriculturalListings_AgriculturalProductTemplates_Agricultu~" TO "FK_AgriculturalAdvertisement_AgriculturalProductTemplates_Agri~";
                ALTER TABLE "AgriculturalAdvertisement" RENAME CONSTRAINT "FK_AgriculturalListings_Farms_FarmId" TO "FK_AgriculturalAdvertisement_Farms_FarmId";
                ALTER TABLE "AgriculturalListingCategory" RENAME CONSTRAINT "FK_AgriculturalListingCategory_AgriculturalListings_ListingId" TO "FK_AgriculturalListingCategory_AgriculturalAdvertisement_Listi~";
                ALTER TABLE "AgriculturalProductSpecificationValues" RENAME CONSTRAINT "FK_AgriculturalProductSpecificationValues_AgriculturalListings~" TO "FK_AgriculturalProductSpecificationValues_AgriculturalAdvertis~";
                ALTER TABLE "ProductInquiries" RENAME CONSTRAINT "FK_ProductInquiries_AgriculturalListings_ListingId" TO "FK_ProductInquiries_AgriculturalAdvertisement_ListingId";
                ALTER TABLE "ProductReports" RENAME CONSTRAINT "FK_ProductReports_AgriculturalListings_ProductId" TO "FK_ProductReports_AgriculturalAdvertisement_ProductId";
                ALTER TABLE "SavedListings" RENAME CONSTRAINT "FK_SavedListings_AgriculturalListings_ListingId" TO "FK_SavedListings_AgriculturalAdvertisement_ListingId";
                ALTER TRIGGER "TR_ReserveEntityCode_AgriculturalListings" ON "AgriculturalAdvertisement" RENAME TO "TR_ReserveEntityCode_AgriculturalAdvertisement";
                UPDATE "EntityCodeRegistry" SET "EntityType" = 'AgriculturalAdvertisement' WHERE "EntityType" = 'AgriculturalListings';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameTable(name: "AgriculturalAdvertisement", newName: "AgriculturalListings");
            migrationBuilder.RenameIndex("IX_AgriculturalAdvertisement_LegacyProductCode",
                newName: "IX_AgriculturalListings_LegacyProductCode", table: "AgriculturalListings");
            migrationBuilder.RenameIndex("IX_AgriculturalAdvertisement_FarmId",
                newName: "IX_AgriculturalListings_FarmId", table: "AgriculturalListings");
            migrationBuilder.RenameIndex("IX_AgriculturalAdvertisement_Code",
                newName: "IX_AgriculturalListings_Code", table: "AgriculturalListings");
            migrationBuilder.RenameIndex("IX_AgriculturalAdvertisement_AgriculturalProductTemplateId",
                newName: "IX_AgriculturalListings_AgriculturalProductTemplateId", table: "AgriculturalListings");

            migrationBuilder.Sql("""
                ALTER TABLE "AgriculturalListings" RENAME CONSTRAINT "PK_AgriculturalAdvertisement" TO "PK_AgriculturalListings";
                ALTER TABLE "AgriculturalListings" RENAME CONSTRAINT "FK_AgriculturalAdvertisement_AgriculturalProductTemplates_Agri~" TO "FK_AgriculturalListings_AgriculturalProductTemplates_Agricultu~";
                ALTER TABLE "AgriculturalListings" RENAME CONSTRAINT "FK_AgriculturalAdvertisement_Farms_FarmId" TO "FK_AgriculturalListings_Farms_FarmId";
                ALTER TABLE "AgriculturalListingCategory" RENAME CONSTRAINT "FK_AgriculturalListingCategory_AgriculturalAdvertisement_Listi~" TO "FK_AgriculturalListingCategory_AgriculturalListings_ListingId";
                ALTER TABLE "AgriculturalProductSpecificationValues" RENAME CONSTRAINT "FK_AgriculturalProductSpecificationValues_AgriculturalAdvertis~" TO "FK_AgriculturalProductSpecificationValues_AgriculturalListings~";
                ALTER TABLE "ProductInquiries" RENAME CONSTRAINT "FK_ProductInquiries_AgriculturalAdvertisement_ListingId" TO "FK_ProductInquiries_AgriculturalListings_ListingId";
                ALTER TABLE "ProductReports" RENAME CONSTRAINT "FK_ProductReports_AgriculturalAdvertisement_ProductId" TO "FK_ProductReports_AgriculturalListings_ProductId";
                ALTER TABLE "SavedListings" RENAME CONSTRAINT "FK_SavedListings_AgriculturalAdvertisement_ListingId" TO "FK_SavedListings_AgriculturalListings_ListingId";
                ALTER TRIGGER "TR_ReserveEntityCode_AgriculturalAdvertisement" ON "AgriculturalListings" RENAME TO "TR_ReserveEntityCode_AgriculturalListings";
                UPDATE "EntityCodeRegistry" SET "EntityType" = 'AgriculturalListings' WHERE "EntityType" = 'AgriculturalAdvertisement';
                """);
        }
    }
}
