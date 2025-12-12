namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageDto
{
    public string Code { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SenderCode { get; set; } = string.Empty;
    public string ReceiverCode { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
