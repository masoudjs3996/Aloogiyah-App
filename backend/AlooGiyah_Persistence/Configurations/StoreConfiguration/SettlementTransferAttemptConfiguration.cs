using AlooGiyah_Domain.Entities.Store;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
namespace AlooGiyah_Persistence.Configurations.StoreConfiguration;
public class SettlementTransferAttemptConfiguration : IEntityTypeConfiguration<SettlementTransferAttempt>
{
    public void Configure(EntityTypeBuilder<SettlementTransferAttempt> b)
    {
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.StartedById).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.AmountToman).HasPrecision(20, 2);
        b.HasOne<AlooGiyah_Domain.Entities.UserFolder.User>().WithMany().HasForeignKey(x => x.CompletedById).OnDelete(DeleteBehavior.Restrict);
        b.Property(x => x.Iban).HasMaxLength(26);
        b.Property(x => x.Provider).HasMaxLength(30);
        b.Property(x => x.Status).HasMaxLength(30);
        b.Property(x => x.ProviderReference).HasMaxLength(150);
        b.Property(x => x.ResolutionNote).HasMaxLength(1000);
        b.Property(x => x.Version).IsConcurrencyToken();
        b.HasOne(x => x.Request).WithMany(x => x.TransferAttempts).HasForeignKey(x => x.SettlementRequestId).OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => x.SettlementRequestId).IsUnique().HasFilter("\"Status\" = 'AwaitingConfirmation'");
        b.HasIndex(x => new { x.Provider, x.ProviderReference }).IsUnique();
    }
}
