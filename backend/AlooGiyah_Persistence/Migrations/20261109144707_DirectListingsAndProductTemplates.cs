using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class DirectListingsAndProductTemplates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgriculturalProductTemplateId",
                table: "AgriculturalProducts",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AgriculturalProductTemplates",
                columns: table => new
                {
                    AgriculturalProductTemplateId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalProductTemplates", x => x.AgriculturalProductTemplateId);
                    table.ForeignKey(
                        name: "FK_AgriculturalProductTemplates_Categories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "Categories",
                        principalColumn: "CategoryId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProductInquiries",
                columns: table => new
                {
                    ProductInquiryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProductId = table.Column<int>(type: "integer", nullable: false),
                    BuyerId = table.Column<int>(type: "integer", nullable: false),
                    SellerId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    EstimatedTotal = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ProductNameSnapshot = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FarmNameSnapshot = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    SaleUnitSnapshot = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: true),
                    BuyerMessage = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    RespondedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductInquiries", x => x.ProductInquiryId);
                    table.ForeignKey(
                        name: "FK_ProductInquiries_AgriculturalProducts_ProductId",
                        column: x => x.ProductId,
                        principalTable: "AgriculturalProducts",
                        principalColumn: "AgriculturalProductId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInquiries_Users_BuyerId",
                        column: x => x.BuyerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProductInquiries_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AgriculturalProductTemplateSpecifications",
                columns: table => new
                {
                    AgriculturalProductTemplateSpecificationId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgriculturalProductTemplateId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalProductTemplateSpecifications", x => x.AgriculturalProductTemplateSpecificationId);
                    table.ForeignKey(
                        name: "FK_AgriculturalProductTemplateSpecifications_AgriculturalProdu~",
                        column: x => x.AgriculturalProductTemplateId,
                        principalTable: "AgriculturalProductTemplates",
                        principalColumn: "AgriculturalProductTemplateId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgriculturalProductTemplateSpecificationOptions",
                columns: table => new
                {
                    AgriculturalProductTemplateSpecificationOptionId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgriculturalProductTemplateSpecificationId = table.Column<int>(type: "integer", nullable: false),
                    Label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalProductTemplateSpecificationOptions", x => x.AgriculturalProductTemplateSpecificationOptionId);
                    table.ForeignKey(
                        name: "FK_AgriculturalProductTemplateSpecificationOptions_Agricultura~",
                        column: x => x.AgriculturalProductTemplateSpecificationId,
                        principalTable: "AgriculturalProductTemplateSpecifications",
                        principalColumn: "AgriculturalProductTemplateSpecificationId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgriculturalProductSpecificationValues",
                columns: table => new
                {
                    AgriculturalProductId = table.Column<int>(type: "integer", nullable: false),
                    AgriculturalProductTemplateSpecificationId = table.Column<int>(type: "integer", nullable: false),
                    AgriculturalProductTemplateSpecificationOptionId = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgriculturalProductSpecificationValues", x => new { x.AgriculturalProductId, x.AgriculturalProductTemplateSpecificationId });
                    table.ForeignKey(
                        name: "FK_AgriculturalProductSpecificationValues_AgriculturalProductT~",
                        column: x => x.AgriculturalProductTemplateSpecificationId,
                        principalTable: "AgriculturalProductTemplateSpecifications",
                        principalColumn: "AgriculturalProductTemplateSpecificationId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_AgriculturalProductSpecificationValues_AgriculturalProducts~",
                        column: x => x.AgriculturalProductId,
                        principalTable: "AgriculturalProducts",
                        principalColumn: "AgriculturalProductId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgriculturalProductSpecificationValues_AgriculturalProduct~1",
                        column: x => x.AgriculturalProductTemplateSpecificationOptionId,
                        principalTable: "AgriculturalProductTemplateSpecificationOptions",
                        principalColumn: "AgriculturalProductTemplateSpecificationOptionId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProducts_AgriculturalProductTemplateId",
                table: "AgriculturalProducts",
                column: "AgriculturalProductTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductSpecificationValues_AgriculturalProduct~1",
                table: "AgriculturalProductSpecificationValues",
                column: "AgriculturalProductTemplateSpecificationOptionId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductSpecificationValues_AgriculturalProductT~",
                table: "AgriculturalProductSpecificationValues",
                column: "AgriculturalProductTemplateSpecificationId");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductSpecificationValues_Code",
                table: "AgriculturalProductSpecificationValues",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplates_CategoryId_Name",
                table: "AgriculturalProductTemplates",
                columns: new[] { "CategoryId", "Name" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplates_Code",
                table: "AgriculturalProductTemplates",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplateSpecificationOptions_Agricultura~",
                table: "AgriculturalProductTemplateSpecificationOptions",
                columns: new[] { "AgriculturalProductTemplateSpecificationId", "Label" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplateSpecificationOptions_Code",
                table: "AgriculturalProductTemplateSpecificationOptions",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplateSpecifications_AgriculturalProdu~",
                table: "AgriculturalProductTemplateSpecifications",
                columns: new[] { "AgriculturalProductTemplateId", "Name" },
                unique: true,
                filter: "\"IsDeleted\" = FALSE");

            migrationBuilder.CreateIndex(
                name: "IX_AgriculturalProductTemplateSpecifications_Code",
                table: "AgriculturalProductTemplateSpecifications",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductInquiries_BuyerId_ProductId_Status",
                table: "ProductInquiries",
                columns: new[] { "BuyerId", "ProductId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_ProductInquiries_Code",
                table: "ProductInquiries",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductInquiries_ProductId",
                table: "ProductInquiries",
                column: "ProductId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductInquiries_SellerId_Status_CreatedAt",
                table: "ProductInquiries",
                columns: new[] { "SellerId", "Status", "CreatedAt" });

            // These tables were added after global entity-code protection was
            // introduced. Register their codes too so a public code can never
            // collide with an older entity type.
            migrationBuilder.Sql("""
                CREATE TRIGGER "TR_ReserveEntityCode_AgriculturalProductTemplates"
                BEFORE INSERT OR UPDATE ON "AgriculturalProductTemplates"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
                CREATE TRIGGER "TR_ReserveEntityCode_AgriculturalProductTemplateSpecifications"
                BEFORE INSERT OR UPDATE ON "AgriculturalProductTemplateSpecifications"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
                CREATE TRIGGER "TR_ReserveEntityCode_AgriculturalProductTemplateSpecificationOptions"
                BEFORE INSERT OR UPDATE ON "AgriculturalProductTemplateSpecificationOptions"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
                CREATE TRIGGER "TR_ReserveEntityCode_AgriculturalProductSpecificationValues"
                BEFORE INSERT OR UPDATE ON "AgriculturalProductSpecificationValues"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
                CREATE TRIGGER "TR_ReserveEntityCode_ProductInquiries"
                BEFORE INSERT OR UPDATE ON "ProductInquiries"
                FOR EACH ROW EXECUTE FUNCTION enforce_global_entity_code();
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_AgriculturalProducts_AgriculturalProductTemplates_Agricultu~",
                table: "AgriculturalProducts",
                column: "AgriculturalProductTemplateId",
                principalTable: "AgriculturalProductTemplates",
                principalColumn: "AgriculturalProductTemplateId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "EntityCodeRegistry" WHERE "EntityType" IN
                ('AgriculturalProductTemplates', 'AgriculturalProductTemplateSpecifications',
                 'AgriculturalProductTemplateSpecificationOptions', 'AgriculturalProductSpecificationValues',
                 'ProductInquiries');
                """);
            migrationBuilder.DropForeignKey(
                name: "FK_AgriculturalProducts_AgriculturalProductTemplates_Agricultu~",
                table: "AgriculturalProducts");

            migrationBuilder.DropTable(
                name: "AgriculturalProductSpecificationValues");

            migrationBuilder.DropTable(
                name: "ProductInquiries");

            migrationBuilder.DropTable(
                name: "AgriculturalProductTemplateSpecificationOptions");

            migrationBuilder.DropTable(
                name: "AgriculturalProductTemplateSpecifications");

            migrationBuilder.DropTable(
                name: "AgriculturalProductTemplates");

            migrationBuilder.DropIndex(
                name: "IX_AgriculturalProducts_AgriculturalProductTemplateId",
                table: "AgriculturalProducts");

            migrationBuilder.DropColumn(
                name: "AgriculturalProductTemplateId",
                table: "AgriculturalProducts");
        }
    }
}
