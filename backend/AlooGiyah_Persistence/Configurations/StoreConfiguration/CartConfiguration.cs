using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class CartConfiguration : IEntityTypeConfiguration<Cart>
{
    public void Configure(EntityTypeBuilder<Cart> builder)
    {
        builder.ToTable("Carts");

        builder.HasKey(c => c.CartId);

        builder.Property(c => c.CartId)
     .HasDefaultValueSql("gen_random_uuid()") // برای PostgreSQL
     .ValueGeneratedOnAdd();

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.UpdatedAt)
            .IsRequired(false);

        // UserId اختیاری است (null = مهمان)
        builder.Property(c => c.UserId)
            .IsRequired(false);

        // رابطه با User (اختیاری)
        builder.HasOne(c => c.User)
            .WithMany(u => u.Carts) // اگر در User navigation property برای Cartها اضافه کردی
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.SetNull); // اگر کاربر حذف شد، UserId null بشه

        // رابطه یک به چند با CartItem ها
        builder.HasMany(c => c.CartItems)
            .WithOne(ci => ci.Cart)
            .HasForeignKey(ci => ci.CartId)
            .OnDelete(DeleteBehavior.Cascade); // اگر سبد حذف شد، آیتم‌ها هم حذف بشن

        // ایندکس برای جستجوی سریع بر اساس CartId و UserId
        builder.HasIndex(c => c.CartId)
            .IsUnique();

        builder.HasIndex(c => c.UserId);
    }
}
