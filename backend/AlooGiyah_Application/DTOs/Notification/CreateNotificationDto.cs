
using System.ComponentModel.DataAnnotations;


namespace AlooGiyah_Application.DTOs.Notification;

public class CreateNotificationDto
{
    [Required]
    public string UserCode { get; set; }
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;
    [MaxLength(50)]
    public string Type { get; set; } = string.Empty;
}
