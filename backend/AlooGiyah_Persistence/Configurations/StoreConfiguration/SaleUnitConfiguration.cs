using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;
public class SaleUnitConfiguration : IEntityTypeConfiguration<AgriculturalProduct>, IEntityTypeConfiguration<AgriculturalOrderItem>
{
    public void Configure(EntityTypeBuilder<AgriculturalProduct> b)
    {
        b.Property(p => p.SaleUnit).IsConcurrencyToken();
        b.ToTable(t => t.HasCheckConstraint("CK_AgriculturalProducts_SaleUnit", "\"SaleUnit\" IS NULL OR \"SaleUnit\" IN ('Kilogram','Package','Piece')"));
    }
    public void Configure(EntityTypeBuilder<AgriculturalOrderItem> b) => b.ToTable(t => t.HasCheckConstraint("CK_AgriculturalOrderItems_SaleUnit", "\"SaleUnit\" IS NULL OR \"SaleUnit\" IN ('Kilogram','Package','Piece')"));
}
