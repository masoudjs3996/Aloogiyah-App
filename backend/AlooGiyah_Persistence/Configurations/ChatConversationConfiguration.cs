using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ChatConversationConfiguration : IEntityTypeConfiguration<ChatConversation>
{
    public void Configure(EntityTypeBuilder<ChatConversation> builder)
    {
        builder.HasKey(x => x.ChatConversationId);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(10);
        builder.Property(x => x.CreatedAt).IsRequired();
        builder.HasIndex(x => new { x.ParticipantOneId, x.ParticipantTwoId }).IsUnique();
        builder.HasOne(x => x.ParticipantOne).WithMany().HasForeignKey(x => x.ParticipantOneId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ParticipantTwo).WithMany().HasForeignKey(x => x.ParticipantTwoId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.Messages).WithOne(x => x.Conversation).HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Restrict);
    }
}
