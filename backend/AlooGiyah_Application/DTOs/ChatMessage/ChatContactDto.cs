namespace AlooGiyah_Application.DTOs.ChatMessage;

public sealed class ChatContactDto
{
    public string Code { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? FarmName { get; set; }
    public string? ProductName { get; set; }
}
