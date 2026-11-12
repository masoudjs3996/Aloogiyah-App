using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ChatMessageAttachmentConfiguration : IEntityTypeConfiguration<ChatMessageAttachment>
{
    public void Configure(EntityTypeBuilder<ChatMessageAttachment> builder)
    {
        builder.HasKey(x => x.ChatMessageAttachmentId);
        builder.Property(x => x.FileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ContentType).IsRequired().HasMaxLength(150);
        builder.HasIndex(x => new { x.ChatMessageId, x.FileId }).IsUnique();
        builder.HasOne(x => x.Message).WithMany().HasForeignKey(x => x.ChatMessageId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.File).WithMany().HasForeignKey(x => x.FileId).OnDelete(DeleteBehavior.Restrict);
    }
}
