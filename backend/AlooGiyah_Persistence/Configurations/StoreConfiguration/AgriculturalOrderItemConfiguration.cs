using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AgriculturalOrderItemConfiguration : IEntityTypeConfiguration<AgriculturalOrderItem>
{
    public void Configure(EntityTypeBuilder<AgriculturalOrderItem> builder)
    {
        builder.HasKey(aoi => aoi.AgriculturalOrderItemId);

        builder.Property(aoi => aoi.Quantity)
            .IsRequired();

        builder.Property(aoi => aoi.Price)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(aoi => aoi.AgriculturalOrderId)
            .IsRequired();

        builder.Property(aoi => aoi.AgriculturalProductId)
            .IsRequired();

        builder.HasOne(aoi => aoi.AgriculturalOrder)
            .WithMany(ao => ao.AgriculturalOrderItems)
            .HasForeignKey(aoi => aoi.AgriculturalOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(aoi => aoi.AgriculturalProduct)
            .WithMany(ap => ap.AgriculturalOrderItems)
            .HasForeignKey(aoi => aoi.AgriculturalProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}