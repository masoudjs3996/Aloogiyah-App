using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.ProductId);

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(p => p.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(p => p.RetailPrice)
            .IsRequired()
            .HasPrecision(20, 2);


        builder.Property(p => p.WholesalePrice)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(p => p.Stock)
            .IsRequired();


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