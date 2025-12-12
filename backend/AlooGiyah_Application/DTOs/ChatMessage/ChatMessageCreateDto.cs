
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageCreateDto
{
    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    [Required]
    public string ReceiverCode { get; set; } = string.Empty;
}
