using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;
public class CheckoutConfiguration : IEntityTypeConfiguration<Checkout>
{
    public void Configure(EntityTypeBuilder<Checkout> builder)
    {
        builder.HasKey(x => x.CheckoutId);
        builder.Property(x => x.IdempotencyKey).HasMaxLength(100).IsRequired();
        builder.Property(x => x.RequestHash).HasMaxLength(64).IsRequired();
        builder.HasIndex(x => new { x.BuyerId, x.IdempotencyKey }).IsUnique();
        builder.HasIndex(x => new { x.CartId, x.IsSubmitted, x.IsPaid, x.IsExpired });
        builder.Property(x => x.PayableAmount).HasPrecision(20, 2);
        builder.Property(x => x.Version).IsConcurrencyToken();
        builder.HasOne(x => x.Buyer).WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Discount).WithMany().HasForeignKey(x => x.DiscountId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Orders).WithOne(x => x.Checkout).HasForeignKey(x => x.CheckoutId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Payments).WithOne(x => x.Checkout).HasForeignKey(x => x.CheckoutId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class CheckoutPaymentConfiguration : IEntityTypeConfiguration<CheckoutPayment>
{
    public void Configure(EntityTypeBuilder<CheckoutPayment> builder)
    {
        builder.HasKey(x => x.CheckoutPaymentId);
        builder.HasIndex(x => x.CheckoutId).IsUnique(); // One settled wallet payment per checkout.
        builder.HasIndex(x => x.Reference).IsUnique();
        builder.Property(x => x.Reference).HasMaxLength(150);
        builder.Property(x => x.Amount).HasPrecision(20, 2);
    }
}
public class OrderRefundConfiguration : IEntityTypeConfiguration<OrderRefund>
{
    public void Configure(EntityTypeBuilder<OrderRefund> builder)
    {
        builder.HasKey(x => x.OrderRefundId);
        builder.HasIndex(x => x.AgriculturalOrderId).IsUnique();
        builder.Property(x => x.Amount).HasPrecision(20, 2);
        builder.Property(x => x.Version).IsConcurrencyToken();
        builder.Property(x => x.Reference).HasMaxLength(150);
        builder.HasIndex(x => x.Reference).IsUnique().HasFilter("\"Reference\" IS NOT NULL");
        builder.HasOne(x => x.Order).WithOne(x => x.Refund).HasForeignKey<OrderRefund>(x => x.AgriculturalOrderId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class AgriculturalOrderHistoryConfiguration : IEntityTypeConfiguration<AgriculturalOrderHistory>
{
    public void Configure(EntityTypeBuilder<AgriculturalOrderHistory> builder)
    {
        builder.HasKey(x => x.AgriculturalOrderHistoryId);
        builder.HasOne(x => x.Order).WithMany(x => x.History).HasForeignKey(x => x.AgriculturalOrderId).OnDelete(DeleteBehavior.Restrict);
    }
}
