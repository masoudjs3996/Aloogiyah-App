using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.UserId);

        builder.Property(u => u.UserId)
            .ValueGeneratedOnAdd();

        builder.Property(u => u.FName)
            .HasMaxLength(80);

        builder.Property(u => u.LName)
            .HasMaxLength(150);

        builder.Property(u => u.Email)
            .HasMaxLength(255);

        builder.Property(u => u.UserName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(u => u.Password)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(20);

        builder.Property(u => u.RoleId)
            .IsRequired();

        builder.Property(u => u.EmailVerificationCode)
            .HasMaxLength(50);

        builder.Property(u => u.PasswordResetCode)
            .HasMaxLength(50);

        builder.HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(u => u.Addresses)
           .WithOne(a => a.User)
           .HasForeignKey(a => a.UserId)
           .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(u => u.Email)
            .IsUnique();

        builder.HasIndex(u => u.UserName)
            .IsUnique();
    }
}