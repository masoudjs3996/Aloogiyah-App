using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class QualityAssessmentConfiguration : IEntityTypeConfiguration<QualityAssessment>
{
    public void Configure(EntityTypeBuilder<QualityAssessment> builder)
    {
        builder.Property(x => x.Fee).HasPrecision(20, 2);
        builder.Property(x => x.DiscountAmount).HasPrecision(20, 2);
        builder.Property(x => x.PaidAmount).HasPrecision(20, 2);
        builder.Property(x => x.RequestedQuantity).HasPrecision(20, 2);
        builder.HasIndex(x => new { x.ApplicantId, x.IdempotencyKey }).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");
        builder.HasOne(x => x.AgriculturalOrder).WithMany().HasForeignKey(x => x.AgriculturalOrderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasKey(qa => qa.QualityAssessmentId);

        builder.Property(qa => qa.AgriculturalProductId)
            .IsRequired();

        builder.Property(qa => qa.ExpertId);

        builder.Property(qa => qa.QualityDescription)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(qa => qa.QualityGrade)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(qa => qa.SuggestedPrice)
            .HasPrecision(20, 2);

        builder.Property(qa => qa.CreatedAt)
            .IsRequired();

        builder.HasOne(qa => qa.AgriculturalProduct)
            .WithMany(qa => qa.QualityAssessments)
            .HasForeignKey(qa => qa.AgriculturalProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qa => qa.Expert)
            .WithMany(u => u.ExpertQualityAssessments)
            .HasForeignKey(qa => qa.ExpertId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qa => qa.Applicant)
          .WithMany(u => u.ApplicantQualityAssessments)
          .HasForeignKey(qa => qa.ApplicantId)
          .OnDelete(DeleteBehavior.Restrict);
    }
}