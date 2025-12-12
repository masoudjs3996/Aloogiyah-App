using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.HasKey(w => w.WarehouseId);

        builder.Property(w => w.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(w => w.Address)
            .HasMaxLength(500);

        builder.Property(w => w.FarmerId)
            .IsRequired();

        builder.HasOne(w => w.Farmer)
            .WithMany(u => u.Warehouses)
            .HasForeignKey(w => w.FarmerId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}