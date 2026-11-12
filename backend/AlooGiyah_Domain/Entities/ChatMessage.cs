using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class ChatMessage : BaseEntity
{

    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatMessageId { get; set; }

    [MaxLength(255)] public string? AttachmentName { get; set; }
    [MaxLength(150)] public string? AttachmentType { get; set; }
    [MaxLength(100)] public string? AttachmentKey { get; set; }
    public Guid? UploadRequestId { get; set; }
    public long? AttachmentSize { get; set; }
    public Guid? AttachmentGroupId { get; set; }
    public int? AttachmentGroupPosition { get; set; }
    [MaxLength(12000)] public string? AttachmentPreview { get; set; }
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; } = false;
    public bool IsEdited { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
    #endregion


    #region Relations
    public int SenderId { get; set; }
    [ForeignKey(nameof(SenderId))]
    public User Sender { get; set; } = null!;

    public int ReceiverId { get; set; }
    [ForeignKey(nameof(ReceiverId))]
    public User Receiver { get; set; } = null!;

    public int ConversationId { get; set; }
    [ForeignKey(nameof(ConversationId))]
    public ChatConversation Conversation { get; set; } = null!;
    #endregion

}
