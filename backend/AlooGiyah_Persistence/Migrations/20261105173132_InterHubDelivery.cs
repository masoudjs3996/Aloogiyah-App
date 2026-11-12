using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InterHubDelivery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CountyId",
                table: "DeliveryPoints",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DestinationPointId",
                table: "DeliveryBookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReceivedAtOriginQuantity",
                table: "AgriculturalOrderItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.Sql("UPDATE \"AgriculturalOrderItems\" SET \"ReceivedAtOriginQuantity\" = \"ReceivedAtHubQuantity\";");

            migrationBuilder.CreateTable(
                name: "DeliveryLegs",
                columns: table => new
                {
                    DeliveryLegId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DeliveryBookingId = table.Column<int>(type: "integer", nullable: false),
                    OriginPointId = table.Column<int>(type: "integer", nullable: false),
                    DestinationPointId = table.Column<int>(type: "integer", nullable: true),
                    Kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    RouteSnapshot = table.Column<string>(type: "character varying(1500)", maxLength: 1500, nullable: false),
                    Fee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: true),
                    TransitDays = table.Column<int>(type: "integer", nullable: false),
                    IsManualPrice = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryLegs", x => x.DeliveryLegId);
                    table.CheckConstraint("CK_DeliveryLegs_Fee", "\"Fee\" IS NULL OR \"Fee\" >= 0");
                    table.CheckConstraint("CK_DeliveryLegs_Status", "\"Status\" IN ('Waiting', 'InTransit', 'Arrived')");
                    table.CheckConstraint("CK_DeliveryLegs_Target", "(\"Kind\" = 'InterHub' AND \"DestinationPointId\" IS NOT NULL AND \"DestinationPointId\" <> \"OriginPointId\") OR (\"Kind\" = 'Local' AND \"DestinationPointId\" IS NULL)");
                    table.ForeignKey(
                        name: "FK_DeliveryLegs_DeliveryBookings_DeliveryBookingId",
                        column: x => x.DeliveryBookingId,
                        principalTable: "DeliveryBookings",
                        principalColumn: "DeliveryBookingId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryLegs_DeliveryPoints_DestinationPointId",
                        column: x => x.DestinationPointId,
                        principalTable: "DeliveryPoints",
                        principalColumn: "DeliveryPointId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryLegs_DeliveryPoints_OriginPointId",
                        column: x => x.OriginPointId,
                        principalTable: "DeliveryPoints",
                        principalColumn: "DeliveryPointId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "DeliveryRoutes",
                columns: table => new
                {
                    DeliveryRouteId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    OriginPointId = table.Column<int>(type: "integer", nullable: false),
                    DestinationPointId = table.Column<int>(type: "integer", nullable: false),
                    Fee = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: true),
                    MaxQuantity = table.Column<int>(type: "integer", nullable: true),
                    TransitDays = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeliveryRoutes", x => x.DeliveryRouteId);
                    table.CheckConstraint("CK_DeliveryRoutes_Fee", "\"Fee\" IS NULL OR \"Fee\" >= 0");
                    table.CheckConstraint("CK_DeliveryRoutes_Points", "\"OriginPointId\" <> \"DestinationPointId\"");
                    table.CheckConstraint("CK_DeliveryRoutes_Quantity", "\"MaxQuantity\" IS NULL OR \"MaxQuantity\" > 0");
                    table.CheckConstraint("CK_DeliveryRoutes_Transit", "\"TransitDays\" BETWEEN 1 AND 30");
                    table.ForeignKey(
                        name: "FK_DeliveryRoutes_DeliveryPoints_DestinationPointId",
                        column: x => x.DestinationPointId,
                        principalTable: "DeliveryPoints",
                        principalColumn: "DeliveryPointId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeliveryRoutes_DeliveryPoints_OriginPointId",
                        column: x => x.OriginPointId,
                        principalTable: "DeliveryPoints",
                        principalColumn: "DeliveryPointId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryPoints_CountyId",
                table: "DeliveryPoints",
                column: "CountyId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryBookings_DestinationPointId",
                table: "DeliveryBookings",
                column: "DestinationPointId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLegs_Code",
                table: "DeliveryLegs",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLegs_DeliveryBookingId",
                table: "DeliveryLegs",
                column: "DeliveryBookingId",
                unique: true,
                filter: "\"Kind\" = 'Local'");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLegs_DeliveryBookingId_Kind_OriginPointId",
                table: "DeliveryLegs",
                columns: new[] { "DeliveryBookingId", "Kind", "OriginPointId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLegs_DestinationPointId",
                table: "DeliveryLegs",
                column: "DestinationPointId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryLegs_OriginPointId",
                table: "DeliveryLegs",
                column: "OriginPointId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryRoutes_Code",
                table: "DeliveryRoutes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryRoutes_DestinationPointId",
                table: "DeliveryRoutes",
                column: "DestinationPointId");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryRoutes_OriginPointId_DestinationPointId",
                table: "DeliveryRoutes",
                columns: new[] { "OriginPointId", "DestinationPointId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryBookings_DeliveryPoints_DestinationPointId",
                table: "DeliveryBookings",
                column: "DestinationPointId",
                principalTable: "DeliveryPoints",
                principalColumn: "DeliveryPointId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryPoints_Countys_CountyId",
                table: "DeliveryPoints",
                column: "CountyId",
                principalTable: "Countys",
                principalColumn: "CountyId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $guard$
                BEGIN
                    IF EXISTS (SELECT 1 FROM "DeliveryBookings" WHERE "DestinationPointId" IS NOT NULL)
                       OR EXISTS (SELECT 1 FROM "DeliveryLegs") THEN
                        RAISE EXCEPTION 'InterHubDelivery rollback: routed bookings exist; preserve their destinations, receipts and agreed charges before downgrading.';
                    END IF;
                END $guard$;
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryBookings_DeliveryPoints_DestinationPointId",
                table: "DeliveryBookings");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryPoints_Countys_CountyId",
                table: "DeliveryPoints");

            migrationBuilder.DropTable(
                name: "DeliveryLegs");

            migrationBuilder.DropTable(
                name: "DeliveryRoutes");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryPoints_CountyId",
                table: "DeliveryPoints");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryBookings_DestinationPointId",
                table: "DeliveryBookings");

            migrationBuilder.DropColumn(
                name: "CountyId",
                table: "DeliveryPoints");

            migrationBuilder.DropColumn(
                name: "DestinationPointId",
                table: "DeliveryBookings");

            migrationBuilder.DropColumn(
                name: "ReceivedAtOriginQuantity",
                table: "AgriculturalOrderItems");
        }
    }
}
