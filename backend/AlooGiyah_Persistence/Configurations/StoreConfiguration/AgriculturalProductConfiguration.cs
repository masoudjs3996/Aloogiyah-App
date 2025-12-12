using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AgriculturalProductConfiguration : IEntityTypeConfiguration<AgriculturalProduct>
{
    public void Configure(EntityTypeBuilder<AgriculturalProduct> builder)
    {
        builder.HasKey(ap => ap.AgriculturalProductId);

        builder.Property(ap => ap.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(ap => ap.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(ap => ap.RetailPrice)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(ap => ap.WholesalePrice)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(ap => ap.Stock)
            .IsRequired();

        builder.Property(ap => ap.FarmId)
            .IsRequired();

        builder.Property(ap => ap.StatusId)
            .IsRequired();

        builder.HasOne(ap => ap.Farm)
            .WithMany(u => u.AgriculturalProduct)
            .HasForeignKey(ap => ap.FarmId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ap => ap.Status)
            .WithMany(s => s.AgriculturalProducts)
            .HasForeignKey(ap => ap.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(p => p.Slug)
    .IsRequired()
    .HasMaxLength(255);

        builder.Property(p => p.MetaTitle)
            .HasMaxLength(255);

        builder.Property(p => p.MetaDescription)
            .HasMaxLength(500);

        builder.Property(p => p.MetaKeywords)
            .HasMaxLength(255);

    }
}