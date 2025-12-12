using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using AlooGiyah_Domain.Entities.UserFolder;

namespace AlooGiyah_Persistence.Configurations;

public class WalletConfiguration : IEntityTypeConfiguration<Wallet>
{
    public void Configure(EntityTypeBuilder<Wallet> builder) 
    {


        builder.HasKey(w => w.WalletId);

        builder.Property(w => w.Balance)
            .HasPrecision(20, 2)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(w => w.HeldAmount)
            .HasPrecision(20, 2)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(w => w.UserId)
                .IsRequired();

        builder.HasOne(w => w.User)
             .WithOne(u => u.Wallet)
             .HasForeignKey<Wallet>(w => w.UserId)
             .OnDelete(DeleteBehavior.Cascade);
    }

}
