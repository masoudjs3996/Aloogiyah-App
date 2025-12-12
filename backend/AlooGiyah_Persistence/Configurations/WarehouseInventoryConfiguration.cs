using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class WarehouseInventoryConfiguration : IEntityTypeConfiguration<WarehouseInventory>
{
    public void Configure(EntityTypeBuilder<WarehouseInventory> builder)
    {
        builder.HasKey(wi => wi.WarehouseInventoryId);

        builder.Property(wi => wi.WarehouseId)
            .IsRequired();

        builder.Property(wi => wi.EntityId)
            .IsRequired();

        builder.Property(wi => wi.EntityWarehouse)
            .IsRequired();

        builder.Property(wi => wi.Quantity)
            .IsRequired();

        builder.HasOne(wi => wi.Warehouse)
            .WithMany(w => w.WarehouseInventories)
            .HasForeignKey(wi => wi.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(wi => new { wi.EntityId, wi.EntityWarehouse });
    }
}