using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations;
public class QualityAssessmentTariffConfiguration : IEntityTypeConfiguration<QualityAssessmentTariff>
{
    public void Configure(EntityTypeBuilder<QualityAssessmentTariff> builder) { builder.HasKey(x => x.QualityAssessmentTariffId); builder.Property(x => x.Fee).HasPrecision(20, 2); }
}
