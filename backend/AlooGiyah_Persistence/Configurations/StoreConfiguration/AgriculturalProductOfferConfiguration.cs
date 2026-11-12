using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AgriculturalProductOfferConfiguration : IEntityTypeConfiguration<AgriculturalProductOffer>
{
    public void Configure(EntityTypeBuilder<AgriculturalProductOffer> builder)
    {
        builder.ToTable("AgriculturalProductOffers", table => {
            table.HasCheckConstraint("CK_ProductOffers_Percentage", "\"Percentage\">0 AND \"Percentage\"<=100");
            table.HasCheckConstraint("CK_ProductOffers_Dates", "\"EndsAt\">\"StartsAt\"");
        });
        builder.HasKey(o => o.AgriculturalProductOfferId);
        builder.Property(o => o.Percentage).HasPrecision(5, 2);
        builder.HasIndex(o => new { o.AgriculturalProductId, o.EndsAt });
        builder.HasOne(o => o.AgriculturalProduct).WithMany(p => p.Offers)
            .HasForeignKey(o => o.AgriculturalProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
