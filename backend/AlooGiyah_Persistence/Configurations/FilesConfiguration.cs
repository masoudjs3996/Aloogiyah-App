using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class FilesConfiguration : IEntityTypeConfiguration<Files>
{
    public void Configure(EntityTypeBuilder<Files> builder)
    {
        builder.HasKey(f => f.FileId);

        builder.Property(f => f.FileId)
            .ValueGeneratedOnAdd(); // Auto-Increment برای int

        builder.Property(f => f.Url)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(f => f.FileTypeId)
            .IsRequired();

        builder.Property(f => f.UserId)
            .IsRequired();

        builder.Property(f => f.Description)
            .HasMaxLength(500);

        builder.Property(f => f.EntityFile)
            .IsRequired();

        builder.HasOne(f => f.FileType)
            .WithMany(ft => ft.Files)
            .HasForeignKey(f => f.FileTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.User)
            .WithMany(u => u.Files)
            .HasForeignKey(f => f.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(f => new { f.EntityFile });
        builder.HasIndex(f => f.UserId);
    }
}