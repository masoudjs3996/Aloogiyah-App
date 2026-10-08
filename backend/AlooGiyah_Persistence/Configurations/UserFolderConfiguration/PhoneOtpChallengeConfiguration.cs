using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration;

public class PhoneOtpChallengeConfiguration : IEntityTypeConfiguration<PhoneOtpChallenge>
{
    public void Configure(EntityTypeBuilder<PhoneOtpChallenge> builder)
    {
        builder.HasKey(x => x.PhoneOtpChallengeId);
        builder.Property(x => x.PhoneOtpChallengeId).ValueGeneratedOnAdd();
        builder.Property(x => x.PhoneNumber).IsRequired().HasMaxLength(20);
        builder.Property(x => x.CodeHash).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Purpose).IsRequired().HasMaxLength(20);
        builder.Property(x => x.FName).HasMaxLength(80);
        builder.Property(x => x.LName).HasMaxLength(150);
        builder.HasIndex(x => new { x.PhoneNumber, x.Purpose, x.CreatedAt });
    }
}
