using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ChatConversationBlockConfiguration : IEntityTypeConfiguration<ChatConversationBlock>
{
    public void Configure(EntityTypeBuilder<ChatConversationBlock> builder)
    {
        builder.HasKey(x => x.ChatConversationBlockId);
        builder.Property(x => x.BlockedAt).IsRequired();
        builder.HasIndex(x => new { x.ConversationId, x.BlockedByUserId }).IsUnique();
        builder.HasOne(x => x.Conversation).WithMany().HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.BlockedByUser).WithMany().HasForeignKey(x => x.BlockedByUserId).OnDelete(DeleteBehavior.Restrict);
    }
}
