using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;

using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(rt => rt.RefreshTokenId);

        builder.Property(rt => rt.Token)
            .IsRequired();

        builder.Property(rt => rt.Expires)
            .IsRequired();

        builder.Property(rt => rt.IsRevoked)
            .IsRequired();

        builder.Property(rt => rt.IsUsed)
            .IsRequired();

        builder.Property(rt => rt.UserId)
            .IsRequired();

        builder.HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}