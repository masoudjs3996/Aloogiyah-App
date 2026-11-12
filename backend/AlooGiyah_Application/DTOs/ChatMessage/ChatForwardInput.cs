using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.ChatMessage;
public class ChatForwardInput
{
    [Required] public string ConversationCode { get; set; } = string.Empty;
}
