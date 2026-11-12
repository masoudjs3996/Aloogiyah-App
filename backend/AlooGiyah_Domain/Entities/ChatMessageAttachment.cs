using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

/// <summary>Associates uploaded file records with a message without storing file bytes in the chat tables.</summary>
public class ChatMessageAttachment : BaseEntity
{
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int ChatMessageAttachmentId { get; set; }
    public int ChatMessageId { get; set; }
    public int FileId { get; set; }
    [MaxLength(255)] public string FileName { get; set; } = string.Empty;
    [MaxLength(150)] public string ContentType { get; set; } = string.Empty;
    public long SizeInBytes { get; set; }
    public ChatMessage Message { get; set; } = null!;
    public Files File { get; set; } = null!;
}
