using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class DeliveryRouteConfiguration : IEntityTypeConfiguration<DeliveryRoute>
{
    public void Configure(EntityTypeBuilder<DeliveryRoute> b)
    {
        b.HasOne(x => x.OriginPoint).WithMany().HasForeignKey(x => x.OriginPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.DestinationPoint).WithMany().HasForeignKey(x => x.DestinationPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.OriginPointId, x.DestinationPointId }).IsUnique();
        b.Property(x => x.Fee).HasPrecision(20, 2);
        b.Property(x => x.PricingMode).HasMaxLength(20).HasDefaultValue("Flat").IsConcurrencyToken();
        b.Property(x => x.Fee).IsConcurrencyToken();
        b.ToTable(t =>
        {
            t.HasCheckConstraint("CK_DeliveryRoutes_Points", "\"OriginPointId\" <> \"DestinationPointId\"");
            t.HasCheckConstraint("CK_DeliveryRoutes_PricingMode", "\"PricingMode\" IN ('Flat', 'CategoryUnits')");
            t.HasCheckConstraint("CK_DeliveryRoutes_Fee", "\"Fee\" IS NULL OR \"Fee\" >= 0");
            t.HasCheckConstraint("CK_DeliveryRoutes_Quantity", "\"MaxQuantity\" IS NULL OR \"MaxQuantity\" > 0");
            t.HasCheckConstraint("CK_DeliveryRoutes_Transit", "\"TransitDays\" BETWEEN 1 AND 30");
        });
    }
}

public class DeliveryCategoryTariffConfiguration : IEntityTypeConfiguration<DeliveryCategoryTariff>
{
    public void Configure(EntityTypeBuilder<DeliveryCategoryTariff> b)
    {
        b.HasOne(x => x.Route).WithMany(x => x.CategoryTariffs).HasForeignKey(x => x.DeliveryRouteId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.DeliveryRouteId, x.CategoryId, x.SaleUnit }).IsUnique();
        b.Property(x => x.SaleUnit).HasMaxLength(16).IsConcurrencyToken();
        b.Property(x => x.PricePerBlock).HasPrecision(20, 2).IsConcurrencyToken();
        b.Property(x => x.BlockSize).IsConcurrencyToken();
        b.Property(x => x.IsDeleted).IsConcurrencyToken();
        b.ToTable(t =>
        {
            t.HasCheckConstraint("CK_DeliveryCategoryTariffs_Unit", "\"SaleUnit\" IN ('Kilogram','Package','Piece')");
            t.HasCheckConstraint("CK_DeliveryCategoryTariffs_Size", "\"BlockSize\" > 0");
            t.HasCheckConstraint("CK_DeliveryCategoryTariffs_Price", "\"PricePerBlock\" BETWEEN 0 AND 1000000000");
        });
    }
}

public class DeliveryLegConfiguration : IEntityTypeConfiguration<DeliveryLeg>
{
    public void Configure(EntityTypeBuilder<DeliveryLeg> b)
    {
        b.Property(x => x.PricingDetailsJson).HasDefaultValue("[]");
        b.HasOne(x => x.Booking).WithMany(x => x.Legs).HasForeignKey(x => x.DeliveryBookingId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.OriginPoint).WithMany().HasForeignKey(x => x.OriginPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.DestinationPoint).WithMany().HasForeignKey(x => x.DestinationPointId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.DeliveryBookingId, x.Kind, x.OriginPointId }).IsUnique();
        b.HasIndex(x => x.DeliveryBookingId).IsUnique().HasFilter("\"Kind\" = 'Local'");
        b.Property(x => x.Fee).HasPrecision(20, 2);
        b.Property(x => x.Kind).HasMaxLength(20);
        b.Property(x => x.Status).HasMaxLength(20);
        b.Property(x => x.RouteSnapshot).HasMaxLength(1500);
        b.ToTable(t =>
        {
            t.HasCheckConstraint("CK_DeliveryLegs_Fee", "\"Fee\" IS NULL OR \"Fee\" >= 0");
            t.HasCheckConstraint("CK_DeliveryLegs_Target", "(\"Kind\" = 'InterHub' AND \"DestinationPointId\" IS NOT NULL AND \"DestinationPointId\" <> \"OriginPointId\") OR (\"Kind\" = 'Local' AND \"DestinationPointId\" IS NULL)");
            t.HasCheckConstraint("CK_DeliveryLegs_Status", "\"Status\" IN ('Waiting', 'InTransit', 'Arrived')");
        });
    }
}
