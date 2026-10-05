
namespace AlooGiyah_Application.DTOs.Notification;

public class NotificationDto
{
    public required string Code { get; set; }
    public string? UserCode { get; set; }
    public bool IsPublic { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTimeOffset CreatedAt { get; set; } // اگر BaseEntity دارای CreatedDate باشد
}
