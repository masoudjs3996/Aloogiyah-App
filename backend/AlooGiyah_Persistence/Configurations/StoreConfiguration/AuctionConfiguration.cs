using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AuctionConfiguration : IEntityTypeConfiguration<Auction>
{
    public void Configure(EntityTypeBuilder<Auction> builder)
    {
        builder.HasKey(a => a.AuctionId);

        builder.Property(a => a.AgriculturalProductId)
            .IsRequired();

        builder.Property(a => a.StartDate)
            .IsRequired();

        builder.Property(a => a.EndDate)
            .IsRequired();

        builder.Property(a => a.StartingPrice)
            .IsRequired()
            .HasPrecision(20, 2);

        builder.Property(a => a.CurrentPrice)
            .HasPrecision(20, 2);

        builder.Property(a => a.StatusId)
            .IsRequired();

        builder.HasOne(a => a.AgriculturalProduct)
            .WithMany(ap => ap.Auctions)
            .HasForeignKey(a => a.AgriculturalProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Winner)
            .WithMany(u => u.WonAuctions)
            .HasForeignKey(a => a.WinnerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Status)
            .WithMany(s => s.Auctions)
            .HasForeignKey(a => a.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(p => p.Slug)
    .IsRequired()
    .HasMaxLength(255);

        builder.Property(p => p.MetaTitle)
            .HasMaxLength(255);

        builder.Property(p => p.MetaDescription)
            .HasMaxLength(500);

        builder.Property(p => p.MetaKeywords)
            .HasMaxLength(255);

    }
}