using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.ChatMessage;
public sealed class ChatMessageDeleteManyDto
{
    [Required, MinLength(1), MaxLength(100)]
    public string[] Codes { get; set; } = [];
}
