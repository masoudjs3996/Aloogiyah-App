using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration.AddressFolderConfiguration;

public class ProvinceConfiguration : IEntityTypeConfiguration<Province>
{
    public void Configure(EntityTypeBuilder<Province> builder)
    {
        builder.HasKey(p => p.ProvinceId);

        builder.Property(p => p.ProvinceId)
            .ValueGeneratedOnAdd();

        builder.Property(p => p.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasOne(p => p.Status)
    .WithMany()
    .HasForeignKey(p => p.StatusId)
    .OnDelete(DeleteBehavior.Restrict);

        // یک‌طرفه: Province -> Counties
        builder.HasMany(p => p.Counties)
            .WithOne(c => c.Province)
            .HasForeignKey(c => c.ProvinceId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(p => p.Name)
            .IsUnique();
    }
}