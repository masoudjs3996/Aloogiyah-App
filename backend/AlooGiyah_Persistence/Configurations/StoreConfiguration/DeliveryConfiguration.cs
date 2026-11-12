using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class DeliveryPointConfiguration : IEntityTypeConfiguration<DeliveryPoint>
{
    public void Configure(EntityTypeBuilder<DeliveryPoint> b)
    {
        b.Property(x => x.Name).HasMaxLength(150); b.Property(x => x.Address).HasMaxLength(1000);
        b.Property(x => x.Hours).HasMaxLength(200); b.Property(x => x.CollectionTerms).HasMaxLength(1000);
        b.Property(x => x.DirectFee).HasPrecision(20, 2);
        b.HasOne(x => x.County).WithMany().HasForeignKey(x => x.CountyId).OnDelete(DeleteBehavior.Restrict);
        b.ToTable(t => t.HasCheckConstraint("CK_DeliveryPoints_DirectFee", "\"DirectFee\" IS NULL OR \"DirectFee\" >= 0"));
    }
}
public class DeliveryBookingConfiguration : IEntityTypeConfiguration<DeliveryBooking>
{
    public void Configure(EntityTypeBuilder<DeliveryBooking> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.QuotedById).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Point).WithMany().HasForeignKey(x => x.DeliveryPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.DestinationPoint).WithMany().HasForeignKey(x => x.DestinationPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Checkout).WithOne(x => x.DeliveryBooking).HasForeignKey<DeliveryBooking>(x => x.CheckoutId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.BuyerId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.Fee).HasPrecision(20, 2); b.Property(x => x.ChangeFee).HasPrecision(20, 2);
        b.Property(x => x.DeferredFeeLimit).HasPrecision(20, 2);
        b.Property(x => x.HeldDeliveryFee).HasPrecision(20, 2);
        b.Property(x => x.DeferredFeePaid).HasPrecision(20, 2);
        b.ToTable(t => t.HasCheckConstraint("CK_DeliveryBookings_DeferredFunds",
            "(\"DeferredFeeLimit\" IS NULL OR \"DeferredFeeLimit\" > 0) AND \"HeldDeliveryFee\" >= 0 AND (\"DeferredFeeLimit\" IS NOT NULL OR \"HeldDeliveryFee\" = 0) AND (\"DeferredFeePaid\" IS NULL OR (\"DeferredFeePaid\" >= 0 AND \"HeldDeliveryFee\" = 0))"));
        b.Property(x => x.Version).IsConcurrencyToken(); b.HasIndex(x => new { x.BuyerId, x.CreatedAt });
        b.Property(x => x.Method).HasMaxLength(20); b.Property(x => x.Window).HasMaxLength(200);
        b.HasMany(x => x.Batches).WithOne(x => x.Booking).HasForeignKey(x => x.DeliveryBookingId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.Events).WithOne().HasForeignKey(x => x.DeliveryBookingId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class DeliveryBatchConfiguration : IEntityTypeConfiguration<DeliveryBatch>
{
    public void Configure(EntityTypeBuilder<DeliveryBatch> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.CompletedById).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.AgentId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.Version).IsConcurrencyToken(); b.Property(x => x.CodeHash).HasMaxLength(64);
        b.Property(x => x.Status).HasMaxLength(20); b.Property(x => x.Note).HasMaxLength(1000);
        b.HasMany(x => x.Items).WithOne(x => x.Batch).HasForeignKey(x => x.DeliveryBatchId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class DeliveryBatchItemConfiguration : IEntityTypeConfiguration<DeliveryBatchItem>
{
    public void Configure(EntityTypeBuilder<DeliveryBatchItem> b)
    {
        b.HasIndex(x => new { x.DeliveryBatchId, x.AgriculturalOrderItemId }).IsUnique();
        b.ToTable(t => t.HasCheckConstraint("CK_DeliveryBatchItems_Quantity", "\"Quantity\" > 0"));
        b.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.AgriculturalOrderItemId).OnDelete(DeleteBehavior.Restrict);
    }
}
public class DeliveryEventConfiguration : IEntityTypeConfiguration<DeliveryEvent>
{
    public void Configure(EntityTypeBuilder<DeliveryEvent> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.Action).HasMaxLength(40);
        b.HasIndex(x => new { x.DeliveryBookingId, x.CreatedAt }); b.Property(x => x.Note).HasMaxLength(2000);
    }
}

public class DeliveryOrderItemConfiguration : IEntityTypeConfiguration<AgriculturalOrderItem>
{
    public void Configure(EntityTypeBuilder<AgriculturalOrderItem> b) => b.Property(x => x.DeliveryVersion).IsConcurrencyToken();
}
