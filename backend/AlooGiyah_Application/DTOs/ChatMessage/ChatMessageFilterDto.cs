using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.ChatMessage;

public class ChatMessageFilterDto : BaseFilterDto
{ 
    public string? SenderCode { get; set; }
    public string? ReceiverCode { get; set; }
    public bool? IsRead { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
}