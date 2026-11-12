using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations;
public class BusinessTermsAcceptanceConfiguration : IEntityTypeConfiguration<BusinessTermsAcceptance>
{
    public void Configure(EntityTypeBuilder<BusinessTermsAcceptance> b)
    {
        b.Property(x => x.BusinessType).HasMaxLength(20);
        b.Property(x => x.TermsVersion).HasMaxLength(40);
        b.Property(x => x.TermsHash).HasMaxLength(64);
        b.Property(x => x.TermsSnapshot).HasColumnType("text");
        b.HasOne<BusinessApplication>().WithMany(x => x.TermsAcceptances).HasForeignKey(x => x.BusinessApplicationId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne<User>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.BusinessApplicationId, x.AcceptedAt });
    }
}
