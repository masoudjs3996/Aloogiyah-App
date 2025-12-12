using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration.AddressFolderConfiguration;

public class VillageConfiguration : IEntityTypeConfiguration<Village>
{
    public void Configure(EntityTypeBuilder<Village> builder)
    {
        builder.HasKey(v => v.VillageId);

        builder.Property(v => v.VillageId)
            .ValueGeneratedOnAdd();

        builder.Property(v => v.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(v => v.Latitude)
            .HasColumnType("decimal(10, 8)");

        builder.Property(v => v.Longitude)
            .HasColumnType("decimal(10, 8)");

        builder.HasOne(p => p.Status)
    .WithMany()
    .HasForeignKey(p => p.StatusId)
    .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(v => v.County)
            .WithMany(c => c.Villages)
            .HasForeignKey(v => v.CountyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(v => new { v.CountyId, v.Name })
            .IsUnique();
    }
}