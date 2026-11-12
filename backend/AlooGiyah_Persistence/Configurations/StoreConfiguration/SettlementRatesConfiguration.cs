using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;
public class SettlementRatesConfiguration : IEntityTypeConfiguration<SettlementRates>
{
    public void Configure(EntityTypeBuilder<SettlementRates> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.ChangedById).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.CommissionRate).HasPrecision(7, 4);
        b.Property(x => x.TaxRate).HasPrecision(7, 4);
        b.Property(x => x.Reason).HasMaxLength(1000);
        b.ToTable(t => t.HasCheckConstraint("CK_SettlementRates_Valid", "\"CommissionRate\" >= 0 AND \"TaxRate\" >= 0 AND \"CommissionRate\" + \"TaxRate\" <= 100"));
    }
}
