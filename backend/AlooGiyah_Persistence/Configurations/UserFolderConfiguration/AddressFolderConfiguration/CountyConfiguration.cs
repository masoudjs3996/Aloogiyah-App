using AlooGiyah_Domain.Entities.UserFolder.AddressFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations.UserFolderConfiguration.AddressFolderConfiguration;

public class CountyConfiguration : IEntityTypeConfiguration<County>
{
    public void Configure(EntityTypeBuilder<County> builder)
    {
        builder.HasKey(c => c.CountyId);

        builder.Property(c => c.CountyId)
            .ValueGeneratedOnAdd();

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(255);

        builder.HasOne(p => p.Status)
    .WithMany()
    .HasForeignKey(p => p.StatusId)
    .OnDelete(DeleteBehavior.Restrict);

        // Relation با استان
        builder.HasOne(c => c.Province)
            .WithMany(p => p.Counties)
            .HasForeignKey(c => c.ProvinceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation با شهرها
        builder.HasMany(c => c.Cities)
            .WithOne(ci => ci.County)
            .HasForeignKey(ci => ci.CountyId)
            .OnDelete(DeleteBehavior.Cascade);

        // Relation با روستاها
        builder.HasMany(c => c.Villages)
            .WithOne(v => v.County)
            .HasForeignKey(v => v.CountyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(c => new { c.ProvinceId, c.Name })
            .IsUnique();
    }
}