using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class FileTypeConfiguration : IEntityTypeConfiguration<FileType>
{
    public void Configure(EntityTypeBuilder<FileType> builder)
    {
        builder.HasKey(ft => ft.FileTypeId);

        // غیرفعال کردن Identity برای FileTypeId
        builder.Property(ft => ft.FileTypeId)
               .ValueGeneratedNever(); // این خط مشخص می‌کند که مقدار ID به صورت دستی تنظیم می‌شود

        builder.Property(ft => ft.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ft => ft.Description)
            .HasMaxLength(500);
    }
}