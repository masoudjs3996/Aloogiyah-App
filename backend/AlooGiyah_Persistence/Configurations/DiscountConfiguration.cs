using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class DiscountConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> builder)
    {
        builder.HasKey(d => d.DiscountId);

        builder.Property(d => d.DiscountId)
            .ValueGeneratedOnAdd();

        builder.Property(d => d.Code)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(d => d.DiscountType)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(d => d.Value)
            .IsRequired()
            .HasPrecision(10, 2);

        builder.Property(d => d.StartDate);

        builder.Property(d => d.EndDate);

        builder.Property(d => d.MaxUsage);

        builder.Property(d => d.UsageCount)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(d => d.MaxDiscountAmount);

        builder.Property(d => d.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasIndex(d => d.Code)
            .IsUnique();

        // رابطه یک-به-چند با Order
        builder.HasMany(d => d.Orders)
            .WithOne(o => o.Discount)
            .HasForeignKey(o => o.DiscountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.AgriculturalOrders)
           .WithOne(o => o.Discount)
           .HasForeignKey(o => o.DiscountId)
           .OnDelete(DeleteBehavior.Restrict);


        // رابطه یک-به-چند با ServiceRequest
        builder.HasMany(d => d.ServiceRequests)
            .WithOne(sr => sr.Discount)
            .HasForeignKey(sr => sr.DiscountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(d => d.agriculturalProducts)
            .WithMany(p => p.Discounts)
            .UsingEntity ( j => j.ToTable("DiscountAgriculturalProducts"));

        builder.HasMany(d => d.Products)
            .WithMany(p => p.Discounts)
            .UsingEntity(j => j.ToTable("DiscountProducts"));

        // رابطه چند-به-چند با User
        builder.HasMany(d => d.Users)
            .WithMany(u => u.Discounts)
            .UsingEntity(j => j.ToTable("DiscountUsers")); // نام جدول واسط

        // رابطه چند-به-چند با Product
        builder.HasMany(d => d.Products)
            .WithMany(p => p.Discounts)
            .UsingEntity(j => j.ToTable("DiscountProducts"));

    }
}