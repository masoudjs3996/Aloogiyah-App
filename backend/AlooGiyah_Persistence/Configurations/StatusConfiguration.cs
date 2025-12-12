using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class StatusConfiguration : IEntityTypeConfiguration<Status>
{
    public void Configure(EntityTypeBuilder<Status> builder)
    {
        builder.HasKey(s => s.StatusId);

        builder.Property(s => s.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        builder.Property(s => s.EntityStatus)
            .IsRequired();

        builder.HasKey(s => s.StatusId);
        builder.Property(s => s.Name).IsRequired().HasMaxLength(50);
        builder.Property(s => s.EntityStatus).IsRequired();
    }
}