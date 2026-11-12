using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Domain.Entities;

public sealed class ChatMessageReport
{
    public int Id { get; set; }
    public int MessageId { get; set; }
    public ChatMessage Message { get; set; } = null!;
    public int ReporterId { get; set; }
    [MaxLength(1000)] public string Reason { get; set; } = "";
    [MaxLength(4000)] public string MessageText { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public int? ReviewedById { get; set; }
}
