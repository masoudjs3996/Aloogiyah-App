using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasKey(c => c.CategoryId);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(255);


        builder.HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.Property(p => p.Slug)
    .IsRequired()
    .HasMaxLength(255);

        builder.Property(p => p.MetaTitle)
            .HasMaxLength(255);

        builder.Property(p => p.MetaDescription)
            .HasMaxLength(500);

        builder.Property(p => p.MetaKeywords)
            .HasMaxLength(255);

    }
}