using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class ChatConversationBlock : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatConversationBlockId { get; set; }
    public int ConversationId { get; set; }
    public int BlockedByUserId { get; set; }
    public DateTimeOffset BlockedAt { get; set; } = DateTimeOffset.UtcNow;
    public ChatConversation Conversation { get; set; } = null!;
    public User BlockedByUser { get; set; } = null!;
}
