namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatConversationSummaryDto
{
    public string Code { get; set; } = string.Empty;
    public string PeerCode { get; set; } = string.Empty;
    public string PeerName { get; set; } = string.Empty;
    public string? FarmName { get; set; }
    public string? ProductName { get; set; }
    public string LastMessage { get; set; } = string.Empty;
    public DateTimeOffset LastMessageAt { get; set; }
    public int UnreadCount { get; set; }
}
