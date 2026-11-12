using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;
public class ProductStockConcurrencyConfiguration : IEntityTypeConfiguration<AgriculturalProduct>
{
    public void Configure(EntityTypeBuilder<AgriculturalProduct> b) => b.Property(x => x.Stock).IsConcurrencyToken();
}
public class WalletConcurrencyConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> b)
    {
        b.Property(x => x.Balance).IsConcurrencyToken();
        b.Property(x => x.HeldAmount).IsConcurrencyToken();
    }
}
public class DiscountConcurrencyConfiguration : IEntityTypeConfiguration<Discount>
{
    public void Configure(EntityTypeBuilder<Discount> b) => b.Property(x => x.UsageCount).IsConcurrencyToken();
}
public class CartItemConcurrencyConfiguration : IEntityTypeConfiguration<CartItem>
{
    public void Configure(EntityTypeBuilder<CartItem> b) => b.Property(x => x.Quantity).IsConcurrencyToken();
}
