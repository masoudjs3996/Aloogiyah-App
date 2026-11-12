using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261010120000_ProductOffers")]
public class ProductOffers : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "AgriculturalProductOffers",
            columns: table => new {
                AgriculturalProductOfferId = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                AgriculturalProductId = table.Column<int>(type: "integer", nullable: false),
                Percentage = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                StartsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                EndsAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table => {
                table.PrimaryKey("PK_AgriculturalProductOffers", x => x.AgriculturalProductOfferId);
                table.ForeignKey("FK_AgriculturalProductOffers_AgriculturalProducts_AgriculturalProductId",
                    x => x.AgriculturalProductId, "AgriculturalProducts", "AgriculturalProductId", onDelete: ReferentialAction.Cascade);
                table.CheckConstraint("CK_ProductOffers_Percentage", "\"Percentage\">0 AND \"Percentage\"<=100");
                table.CheckConstraint("CK_ProductOffers_Dates", "\"EndsAt\">\"StartsAt\"");
            });
        migrationBuilder.CreateIndex("IX_AgriculturalProductOffers_Code", "AgriculturalProductOffers", "Code", unique: true);
        migrationBuilder.CreateIndex("IX_AgriculturalProductOffers_AgriculturalProductId_EndsAt", "AgriculturalProductOffers", new[] { "AgriculturalProductId", "EndsAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable("AgriculturalProductOffers");
}
