using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

/// <summary>A private room shared by exactly two users.</summary>
public class ChatConversation : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatConversationId { get; set; }

    public int ParticipantOneId { get; set; }
    public int ParticipantTwoId { get; set; }
    public DateTimeOffset? LastMessageAt { get; set; }

    public User ParticipantOne { get; set; } = null!;
    public User ParticipantTwo { get; set; } = null!;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
