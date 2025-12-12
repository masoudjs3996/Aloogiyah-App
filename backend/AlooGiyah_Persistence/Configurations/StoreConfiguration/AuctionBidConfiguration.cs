using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;

public class AuctionBidConfiguration : IEntityTypeConfiguration<AuctionBid>
{
    public void Configure(EntityTypeBuilder<AuctionBid> builder)
    {
        builder.HasKey(ab => ab.AuctionBidId);

        builder.Property(ab => ab.AuctionId)
            .IsRequired();

        builder.Property(ab => ab.UserId)
            .IsRequired();

        builder.Property(ab => ab.BidAmount)
            .IsRequired()
            .HasPrecision(20,2);

        builder.Property(ab => ab.CreatedAt)
            .IsRequired();

        builder.HasOne(ab => ab.Auction)
            .WithMany(a => a.Bids)
            .HasForeignKey(ab => ab.AuctionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(ab => ab.User)
            .WithMany(u => u.AuctionBids)
            .HasForeignKey(ab => ab.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}