namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatConversationDto
{
    public string Code { get; set; } = string.Empty;
    public string PeerCode { get; set; } = string.Empty;
    public string PeerName { get; set; } = string.Empty;
    public bool PeerOnline { get; set; }
    public string? FarmName { get; set; }
    public string? ProductName { get; set; }
}
