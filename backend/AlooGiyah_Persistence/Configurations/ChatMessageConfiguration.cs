using AlooGiyah_Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace AlooGiyah_Persistence.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(cm => cm.ChatMessageId);

        builder.Property(cm => cm.Message)
            .IsRequired()
            .HasMaxLength(4000);

        builder.Property(cm => cm.IsRead)
            .IsRequired();

        builder.Property(cm => cm.CreatedAt)
            .IsRequired();

        builder.Property(cm => cm.SenderId)
            .IsRequired();

        builder.Property(cm => cm.ReceiverId)
            .IsRequired();

        builder.HasOne(cm => cm.Sender)
            .WithMany(u => u.SentMessages)
            .HasForeignKey(cm => cm.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cm => cm.Receiver)
            .WithMany(u => u.ReceivedMessages)
            .HasForeignKey(cm => cm.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}