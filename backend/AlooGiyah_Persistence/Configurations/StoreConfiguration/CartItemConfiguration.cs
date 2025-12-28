using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;


namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class CartItemConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> builder)
    {
        builder.ToTable("CartItems");

        builder.HasKey(ci => ci.CartItemId);

        builder.Property(ci => ci.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(ci => ci.Price)
            .IsRequired()
            .HasPrecision(20, 2); // مثل فیلدهای قیمت در AgriculturalOrder

        builder.Property(ci => ci.CreatedAt)
            .IsRequired();

        builder.Property(ci => ci.UpdatedAt)
            .IsRequired(false);

        // رابطه با Cart
        builder.HasOne(ci => ci.Cart)
            .WithMany(c => c.CartItems)
            .HasForeignKey(ci => ci.CartId)
            .OnDelete(DeleteBehavior.Cascade);

        // رابطه با AgriculturalProduct
        builder.HasOne(ci => ci.AgriculturalProduct)
            .WithMany(p => p.CartItems) // اگر در AgriculturalProduct navigation اضافه کردی
            .HasForeignKey(ci => ci.AgriculturalProductId)
            .OnDelete(DeleteBehavior.Restrict); // محصول حذف نشه، فقط ارتباط قطع بشه

        // ایندکس برای جستجوی سریع آیتم‌های یک سبد
        builder.HasIndex(ci => ci.CartId);
        builder.HasIndex(ci => ci.AgriculturalProductId);
    }
}
