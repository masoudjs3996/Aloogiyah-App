using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ArticleConfiguration : IEntityTypeConfiguration<Article>
{
    public void Configure(EntityTypeBuilder<Article> builder)
    {
        builder.HasKey(a => a.ArticleId);

        builder.Property(a => a.AuthorId)
            .IsRequired();

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(a => a.Content)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(a => a.CreatedAt)
            .IsRequired();

        builder.HasOne(a => a.Author)
            .WithMany(u => u.Articles)
            .HasForeignKey(a => a.AuthorId)
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