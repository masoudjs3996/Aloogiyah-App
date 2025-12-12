using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration.AddressFolderConfiguration;

public class CityConfiguration : IEntityTypeConfiguration<City>
{
    public void Configure(EntityTypeBuilder<City> builder)
    {
        builder.HasKey(ci => ci.CityId);

        builder.Property(ci => ci.CityId)
            .ValueGeneratedOnAdd();

        builder.Property(ci => ci.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasOne(ci => ci.County)
            .WithMany(c => c.Cities)
            .HasForeignKey(ci => ci.CountyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(p => p.Status)
    .WithMany()
    .HasForeignKey(p => p.StatusId)
    .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(ci => new { ci.CountyId, ci.Name })
            .IsUnique();
    }
}