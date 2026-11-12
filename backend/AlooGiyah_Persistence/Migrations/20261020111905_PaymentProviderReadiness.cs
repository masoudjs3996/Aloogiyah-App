using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace AlooGiyah_Persistence.Migrations
{
    /// <inheritdoc />
    public partial class PaymentProviderReadiness : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentProvider",
                table: "WalletTransactions",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProviderReference",
                table: "WalletTransactions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SettlementTransferAttempts",
                columns: table => new
                {
                    SettlementTransferAttemptId = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SettlementRequestId = table.Column<int>(type: "integer", nullable: false),
                    AmountToman = table.Column<decimal>(type: "numeric(20,2)", precision: 20, scale: 2, nullable: false),
                    Iban = table.Column<string>(type: "character varying(26)", maxLength: 26, nullable: false),
                    Provider = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    Status = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ProviderReference = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    StartedById = table.Column<int>(type: "integer", nullable: false),
                    CompletedById = table.Column<int>(type: "integer", nullable: true),
                    CompletedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ResolutionNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Version = table.Column<Guid>(type: "uuid", nullable: false),
                    Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SettlementTransferAttempts", x => x.SettlementTransferAttemptId);
                    table.ForeignKey(
                        name: "FK_SettlementTransferAttempts_SettlementRequests_SettlementReq~",
                        column: x => x.SettlementRequestId,
                        principalTable: "SettlementRequests",
                        principalColumn: "SettlementRequestId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WalletTransactions_PaymentProvider_ProviderReference",
                table: "WalletTransactions",
                columns: new[] { "PaymentProvider", "ProviderReference" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementTransferAttempts_Code",
                table: "SettlementTransferAttempts",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementTransferAttempts_Provider_ProviderReference",
                table: "SettlementTransferAttempts",
                columns: new[] { "Provider", "ProviderReference" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SettlementTransferAttempts_SettlementRequestId",
                table: "SettlementTransferAttempts",
                column: "SettlementRequestId",
                unique: true,
                filter: "\"Status\" = 'AwaitingConfirmation'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SettlementTransferAttempts");

            migrationBuilder.DropIndex(
                name: "IX_WalletTransactions_PaymentProvider_ProviderReference",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "PaymentProvider",
                table: "WalletTransactions");

            migrationBuilder.DropColumn(
                name: "ProviderReference",
                table: "WalletTransactions");
        }
    }
}
