using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SellerSettlements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SellerReceivables",
                columns: table => new
                {
                    SellerReceivableId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    AgriculturalOrderId = table.Column<int>(type: "integer", nullable: false),
                    SellerId = table.Column<int>(type: "integer", nullable: false),
                    GrossAmount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    CommissionRate = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    CommissionAmount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    TaxRate = table.Column<decimal>(type: "numeric(7,4)", precision: 7, scale: 4, nullable: false),
                    TaxAmount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    NetAmount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    ReleasedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SellerReceivables", x => x.SellerReceivableId);
                    table.ForeignKey(
                        name: "FK_SellerReceivables_AgriculturalOrders_AgriculturalOrderId",
                        column: x => x.AgriculturalOrderId,
                        principalTable: "AgriculturalOrders",
                        principalColumn: "AgriculturalOrderId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SellerReceivables_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SettlementCalendarDays",
                columns: table => new
                {
                    SettlementCalendarDayId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    IsClosed = table.Column<bool>(type: "boolean", nullable: false),
                    ConfirmedById = table.Column<int>(type: "integer", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SettlementCalendarDays", x => x.SettlementCalendarDayId);
                });

            migrationBuilder.CreateTable(
                name: "SettlementRequests",
                columns: table => new
                {
                    SettlementRequestId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SellerId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Iban = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: false),
                    AccountHolder = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    IdempotencyKey = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ScheduledDate = table.Column<DateOnly>(type: "date", nullable: false),
                    CycleSaturday = table.Column<DateOnly>(type: "date", nullable: false),
                    CutoffAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    TransferReference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SettlementRequests", x => x.SettlementRequestId);
                    table.ForeignKey(
                        name: "FK_SettlementRequests_Users_SellerId",
                        column: x => x.SellerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SettlementHistories",
                columns: table => new
                {
                    SettlementHistoryId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SettlementRequestId = table.Column<int>(type: "integer", nullable: false),
                    ActorId = table.Column<int>(type: "integer", nullable: false),
                    Action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SettlementHistories", x => x.SettlementHistoryId);
                    table.ForeignKey(
                        name: "FK_SettlementHistories_SettlementRequests_SettlementRequestId",
                        column: x => x.SettlementRequestId,
                        principalTable: "SettlementRequests",
                        principalColumn: "SettlementRequestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SellerReceivables_AgriculturalOrderId",
                table: "SellerReceivables",
                column: "AgriculturalOrderId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerReceivables_Code",
                table: "SellerReceivables",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SellerReceivables_SellerId",
                table: "SellerReceivables",
                column: "SellerId");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementCalendarDays_Code",
                table: "SettlementCalendarDays",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementCalendarDays_Date",
                table: "SettlementCalendarDays",
                column: "Date",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementHistories_Code",
                table: "SettlementHistories",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementHistories_SettlementRequestId",
                table: "SettlementHistories",
                column: "SettlementRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRequests_Code",
                table: "SettlementRequests",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRequests_SellerId_IdempotencyKey",
                table: "SettlementRequests",
                columns: new[] { "SellerId", "IdempotencyKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRequests_SellerId_Status",
                table: "SettlementRequests",
                columns: new[] { "SellerId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SettlementRequests_TransferReference",
                table: "SettlementRequests",
                column: "TransferReference",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SellerReceivables");

            migrationBuilder.DropTable(
                name: "SettlementCalendarDays");

            migrationBuilder.DropTable(
                name: "SettlementHistories");

            migrationBuilder.DropTable(
                name: "SettlementRequests");
        }
    }
}
