using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class CommentConfiguration : IEntityTypeConfiguration<Comment>
{
    public void Configure(EntityTypeBuilder<Comment> builder)
    {
        builder.HasKey(c => c.CommentId);

        builder.Property(c => c.CommentId)
            .ValueGeneratedOnAdd(); // Auto-Increment برای int

        builder.Property(c => c.Content)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(c => c.UserId)
            .IsRequired();

        builder.Property(c => c.StatusId)
            .IsRequired();

        builder.Property(c => c.EntityCode)
            .IsRequired();

        builder.Property(c => c.EntityComment)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.Property(c => c.Rating)
            .HasColumnType("int")
            .HasAnnotation("CheckConstraint", "Rating BETWEEN 1 AND 5");

        builder.Property(c => c.IsUniqueProductReview)
            .HasDefaultValue(false);

        builder.HasOne(c => c.User)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);


        builder.HasOne(c => c.Status)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.StatusId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(c => new { c.EntityCode, c.EntityComment });
        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => new { c.UserId, c.EntityCode })
            .IsUnique()
            .HasDatabaseName("IX_Comments_UserId_EntityCode_ProductReview")
            .HasFilter("\"IsUniqueProductReview\" AND \"ParentCommentId\" IS NULL AND NOT \"IsDeleted\"");
    }
}
