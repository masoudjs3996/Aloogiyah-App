using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations;
public class BusinessApplicationConfiguration : IEntityTypeConfiguration<BusinessApplication> {
 public void Configure(EntityTypeBuilder<BusinessApplication> b) {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.ReviewedById).OnDelete(DeleteBehavior.Restrict);
  b.HasKey(x=>x.BusinessApplicationId); b.Property(x=>x.Version).IsConcurrencyToken();
  b.Property(x=>x.AddressJson).HasColumnType("jsonb"); b.Property(x=>x.DocumentsJson).HasColumnType("jsonb"); b.Property(x=>x.HistoryJson).HasColumnType("jsonb");
  b.HasOne(x=>x.User).WithMany().HasForeignKey(x=>x.UserId).OnDelete(DeleteBehavior.Restrict);
  b.HasIndex(x=>x.Code).IsUnique();
  b.HasIndex(x=>new{x.UserId,x.BusinessType}).IsUnique().HasFilter("NOT \"IsDeleted\" AND \"Status\" IN ('Pending','NeedsInfo','VisitRequired')");
  b.HasIndex(x=>new{x.Status,x.CreatedAt});
 }
}
