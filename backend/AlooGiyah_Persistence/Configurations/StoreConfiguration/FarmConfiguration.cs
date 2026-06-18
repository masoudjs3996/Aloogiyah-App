using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class FarmConfiguration : IEntityTypeConfiguration<Farm>
{
    public void Configure(EntityTypeBuilder<Farm> builder)
    {
        builder.HasKey(g => g.FarmId);

        builder.Property(g => g.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(g => g.MinPurchase)
            .HasPrecision(20, 2);

        builder.Property(g => g.Description)
            .HasMaxLength(1000);

        builder.Property(g => g.OwnerId)
            .IsRequired();

        builder.HasOne(g => g.Owner)
            .WithMany(u => u.Farms) 
            .HasForeignKey(g => g.OwnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(g => g.Address)
            .WithMany()
            .HasForeignKey(g => g.AddressId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(false);

        builder.HasOne(g => g.Status)
            .WithMany()
            .HasForeignKey(g => g.StatusId)
            .OnDelete(DeleteBehavior.Restrict)
            .IsRequired(true);

        builder.HasMany(g => g.AgriculturalProduct)
            .WithOne(p => p.Farm) 
            .HasForeignKey(p => p.FarmId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}