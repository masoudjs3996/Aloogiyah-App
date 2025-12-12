using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration.AddressFolderConfiguration;

public class AddressConfiguration : IEntityTypeConfiguration<Address>
{
    public void Configure(EntityTypeBuilder<Address> builder)
    {
        builder.HasKey(a => a.AddressId);

        builder.Property(a => a.AddressId)
            .ValueGeneratedOnAdd();

        builder.Property(a => a.Street)
            .HasMaxLength(500)
            .HasDefaultValue(string.Empty);

        builder.Property(a => a.PostalCode)
            .HasMaxLength(20)
            .HasDefaultValue(string.Empty);

        builder.Property(a => a.Latitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(a => a.Longitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(a => a.IsDefault)
            .HasDefaultValue(false);

        // Relations
        builder.HasOne(a => a.User)
            .WithMany(u => u.Addresses)
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.Province)
            .WithMany()
            .HasForeignKey(a => a.ProvinceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.County)
            .WithMany()
            .HasForeignKey(a => a.CountyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.City)
            .WithMany()
            .HasForeignKey(a => a.CityId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        builder.HasOne(a => a.Village)
            .WithMany()
            .HasForeignKey(a => a.VillageId)
            .OnDelete(DeleteBehavior.SetNull)
            .IsRequired(false);

        // یک کاربر فقط یک آدرس پیش‌فرض داشته باشه (اختیاری ولی توصیه میشه)
        builder.HasIndex(a => new { a.UserId, a.IsDefault })
            .HasFilter("\"IsDefault\" = true")
            .IsUnique();
    }
}