using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class SellerReceivableConfiguration : IEntityTypeConfiguration<SellerReceivable>
{
    public void Configure(EntityTypeBuilder<SellerReceivable> b)
    {
        b.HasIndex(x => x.AgriculturalOrderId).IsUnique();
        b.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.AgriculturalOrderId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
        foreach (var p in new[] { "ReleasedAmount", "GrossAmount", "CommissionAmount", "TaxAmount", "NetAmount", "PlatformDiscountAmount", "SellerDiscountAmount" }) b.Property<decimal>(p).HasPrecision(20, 2);
        b.Property(x => x.CommissionRate).HasPrecision(7, 4);
        b.Property(x => x.TaxRate).HasPrecision(7, 4);
        b.Property(x => x.Version).IsConcurrencyToken();
    }
}

public class SettlementRequestConfiguration : IEntityTypeConfiguration<SettlementRequest>
{
    public void Configure(EntityTypeBuilder<SettlementRequest> b)
    {
        b.Property(x => x.Amount).HasPrecision(20, 2);
        b.Property(x => x.Iban).HasMaxLength(26);
        b.Property(x => x.AccountHolder).HasMaxLength(150);
        b.Property(x => x.Status).HasMaxLength(20);
        b.Property(x => x.IdempotencyKey).HasMaxLength(100);
        b.Property(x => x.TransferReference).HasMaxLength(150);
        b.Property(x => x.Version).IsConcurrencyToken();
        b.HasIndex(x => new { x.SellerId, x.IdempotencyKey }).IsUnique();
        b.HasIndex(x => x.TransferReference).IsUnique();
        b.HasIndex(x => new { x.SellerId, x.Status });
        b.HasIndex(x => new { x.Status, x.ScheduledDate });
        b.HasOne<User>().WithMany().HasForeignKey(x => x.SellerId).OnDelete(DeleteBehavior.Restrict);
        b.HasMany(x => x.History).WithOne().HasForeignKey(x => x.SettlementRequestId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class SettlementHistoryConfiguration : IEntityTypeConfiguration<SettlementHistory>
{
    public void Configure(EntityTypeBuilder<SettlementHistory> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.ActorId).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.Action).HasMaxLength(30);
        b.HasIndex(x => new { x.SettlementRequestId, x.CreatedAt });
        b.Property(x => x.Note).HasMaxLength(1000);
    }
}

public class SettlementCalendarDayConfiguration : IEntityTypeConfiguration<SettlementCalendarDay>
{
    public void Configure(EntityTypeBuilder<SettlementCalendarDay> b)
    {
        b.HasIndex(x => x.Date).IsUnique();
        b.HasOne<User>().WithMany().HasForeignKey(x => x.ConfirmedById).OnDelete(DeleteBehavior.Restrict);
    }
}
