using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public abstract class BaseEntityConfiguration<TEntity> : IEntityTypeConfiguration<TEntity> where TEntity : BaseEntity
{
    public virtual void Configure(EntityTypeBuilder<TEntity> builder)
    {
        builder.Property(e => e.Code)
            .IsRequired()
            .HasMaxLength(12);

        builder.Property(e => e.CreatedAt)
            .IsRequired();

        builder.Property(e => e.IsDeleted)
            .IsRequired();
    }
}