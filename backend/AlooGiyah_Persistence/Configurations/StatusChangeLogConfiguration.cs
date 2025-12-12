using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class StatusChangeLogConfiguration : IEntityTypeConfiguration<StatusChangeLog>
{
    public void Configure(EntityTypeBuilder<StatusChangeLog> builder)
    {
        builder.HasKey(scl => scl.StatusChangeLogId);

        builder.Property(scl => scl.EntityId)
            .IsRequired();

        builder.Property(scl => scl.EntityStatus)
            .IsRequired();

        builder.Property(scl => scl.Comments)
            .HasMaxLength(1000);

        builder.Property(scl => scl.OldStatusId)
            .IsRequired();

        builder.Property(scl => scl.NewStatusId)
            .IsRequired();

        builder.Property(scl => scl.UserId)
            .IsRequired();

        builder.Property(scl => scl.ChangeDate)
            .IsRequired();

        builder.HasOne(scl => scl.OldStatus)
            .WithMany(s => s.OldStatusChangeLogs)
            .HasForeignKey(scl => scl.OldStatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(scl => scl.NewStatus)
            .WithMany(s => s.NewStatusChangeLogs)
            .HasForeignKey(scl => scl.NewStatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(scl => scl.User)
            .WithMany(u => u.StatusChangeLogs)
            .HasForeignKey(scl => scl.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(scl => new { scl.EntityId, scl.EntityStatus });
    }
}