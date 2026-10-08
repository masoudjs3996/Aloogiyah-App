using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261007120000_AddPhoneOtpAndRemoveUserAge")]
public partial class AddPhoneOtpAndRemoveUserAge : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "Age", table: "Users");

        migrationBuilder.CreateTable(
            name: "PhoneOtpChallenges",
            columns: table => new
            {
                PhoneOtpChallengeId = table.Column<int>(type: "integer", nullable: false)
                    .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                CodeHash = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                Purpose = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                FName = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                LName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                FailedAttempts = table.Column<int>(type: "integer", nullable: false),
                Code = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false),
                CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_PhoneOtpChallenges", x => x.PhoneOtpChallengeId));

        migrationBuilder.CreateIndex(
            name: "IX_PhoneOtpChallenges_Code_IsDeleted",
            table: "PhoneOtpChallenges",
            columns: new[] { "Code", "IsDeleted" },
            unique: true);
        migrationBuilder.CreateIndex(
            name: "IX_PhoneOtpChallenges_PhoneNumber_Purpose_CreatedAt",
            table: "PhoneOtpChallenges",
            columns: new[] { "PhoneNumber", "Purpose", "CreatedAt" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "PhoneOtpChallenges");
        migrationBuilder.AddColumn<int>(
            name: "Age",
            table: "Users",
            type: "integer",
            nullable: false,
            defaultValue: 0);
    }
}
