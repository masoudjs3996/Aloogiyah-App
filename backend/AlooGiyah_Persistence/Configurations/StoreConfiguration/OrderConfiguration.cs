using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasKey(o => o.OrderId);

        builder.Property(o => o.CreatedAt)
            .IsRequired();

        builder.Property(o => o.TotalPrice)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(o => o.DiscountId);

        builder.Property(o => o.DiscountAmount)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(o => o.StatusId)
            .IsRequired();

        builder.Property(o => o.UserId)
            .IsRequired();

        builder.Property(o => o.AddressId);

        builder.HasOne(o => o.Status)
            .WithMany(s => s.Orders)
            .HasForeignKey(o => o.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.Address)
            .WithMany(a => a.Orders)
            .HasForeignKey(o => o.AddressId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(o => o.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.OrderItems)
           .WithOne(oi => oi.Order)
           .HasForeignKey(oi => oi.OrderId)
           .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(o => o.Discount)
           .WithMany(d => d.Orders)
           .HasForeignKey(o => o.DiscountId)
           .OnDelete(DeleteBehavior.Restrict);
    }
}