using AlooGiyah_Persistence.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace AlooGiyah_Persistence.Migrations;

[DbContext(typeof(AlooGiyahDbContext))]
[Migration("20261017150000_StructuredQualityReports")]
public class StructuredQualityReports : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.AddColumn<string>(
        name: "ReportJson", table: "QualityAssessments", type: "character varying(4000)", maxLength: 4000, nullable: true);
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropColumn(name: "ReportJson", table: "QualityAssessments");
}
