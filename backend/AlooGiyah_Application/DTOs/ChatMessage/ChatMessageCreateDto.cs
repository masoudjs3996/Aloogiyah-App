
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageCreateDto
{
    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public string ConversationCode { get; set; } = string.Empty;
}
