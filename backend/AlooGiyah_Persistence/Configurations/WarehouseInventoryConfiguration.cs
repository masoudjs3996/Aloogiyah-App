using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class WarehouseInventoryConfiguration : IEntityTypeConfiguration<WarehouseInventory>
{
    public void Configure(EntityTypeBuilder<WarehouseInventory> builder)
    {
        builder.HasKey(wi => wi.WarehouseInventoryId);
        builder.HasOne(wi => wi.AgriculturalProduct).WithMany(p => p.WarehouseInventories)
            .HasForeignKey(wi => wi.AgriculturalProductId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(wi => wi.Product).WithMany(p => p.WarehouseInventories)
            .HasForeignKey(wi => wi.ProductId).OnDelete(DeleteBehavior.Restrict);
        builder.ToTable(t =>
        {
            t.HasCheckConstraint("CK_WarehouseInventory_Target",
                "(\"EntityWarehouse\" = 0 AND \"AgriculturalProductId\" IS NOT NULL AND \"AgriculturalProductId\" = \"EntityId\" AND \"ProductId\" IS NULL) OR " +
                "(\"EntityWarehouse\" = 1 AND \"ProductId\" IS NOT NULL AND \"ProductId\" = \"EntityId\" AND \"AgriculturalProductId\" IS NULL)");
            t.HasCheckConstraint("CK_WarehouseInventory_Quantity", "\"Quantity\" >= 0");
        });
        builder.HasIndex(wi => new { wi.WarehouseId, wi.EntityWarehouse, wi.EntityId })
            .IsUnique().HasFilter("NOT \"IsDeleted\"");

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