using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AgriculturalOrderConfiguration : IEntityTypeConfiguration<AgriculturalOrder>
{
    public void Configure(EntityTypeBuilder<AgriculturalOrder> builder)
    {
        builder.HasKey(ao => ao.AgriculturalOrderId);

        builder.Property(ao => ao.CreatedAt)
            .IsRequired();

        builder.Property(ao => ao.StatusId)
            .IsRequired();

        builder.Property(ao => ao.BuyerId)
            .IsRequired();

        builder.Property(o => o.HeldAmount)
          .IsRequired()
          .HasPrecision(20, 2);

        builder.Property(o => o.DiscountAmount)
           .IsRequired()
           .HasPrecision(20, 2);

        builder.Property(o => o.TotalPrice)
           .IsRequired()
           .HasPrecision(20, 2);

        builder.Property(o => o.AddressId)
           .IsRequired();

        builder.HasOne(ao => ao.Address)
            .WithMany(a => a.AgriculturalOrders)
            .HasForeignKey(ao => ao.AddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ao => ao.Status)
            .WithMany(s => s.AgriculturalOrders)
            .HasForeignKey(ao => ao.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ao => ao.Discount)
            .WithMany(s => s.AgriculturalOrders)
            .HasForeignKey(ao => ao.DiscountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ao => ao.Address)
            .WithMany(s => s.AgriculturalOrders)
            .HasForeignKey(ao => ao.AddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ao => ao.Buyer)
            .WithMany(u => u.AgriculturalOrders)
            .HasForeignKey(ao => ao.BuyerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.AgriculturalOrderItems)
           .WithOne(oi => oi.AgriculturalOrder)
           .HasForeignKey(oi => oi.AgriculturalOrderId)
           .OnDelete(DeleteBehavior.Cascade);
    }
}