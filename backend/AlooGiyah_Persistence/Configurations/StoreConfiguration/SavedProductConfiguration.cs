using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations;
public class SavedProductConfiguration : IEntityTypeConfiguration<SavedProduct>
{
    public void Configure(EntityTypeBuilder<SavedProduct> builder)
    {
        builder.HasKey(x => x.SavedProductId);
        builder.HasIndex(x => new { x.UserId, x.AgriculturalProductId }).IsUnique();
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.AgriculturalProduct).WithMany().HasForeignKey(x => x.AgriculturalProductId).OnDelete(DeleteBehavior.Cascade);
    }
}
