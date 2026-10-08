namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageDto
{
    public string Code { get; set; } = string.Empty;
    public string ConversationCode { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SenderCode { get; set; } = string.Empty;
    public string ReceiverCode { get; set; } = string.Empty;
    public string SenderName { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string? SenderFarmName { get; set; }
    public string? ReceiverFarmName { get; set; }
    public string? SenderProductName { get; set; }
    public string? ReceiverProductName { get; set; }
    public bool IsRead { get; set; }
    public bool IsEdited { get; set; }
    public DateTimeOffset? EditedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
