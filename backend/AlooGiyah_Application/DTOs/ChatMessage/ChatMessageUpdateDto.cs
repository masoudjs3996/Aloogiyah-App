
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(4000)]
    public string Message { get; set; } = string.Empty;

    public bool? IsRead { get; set; }
}
