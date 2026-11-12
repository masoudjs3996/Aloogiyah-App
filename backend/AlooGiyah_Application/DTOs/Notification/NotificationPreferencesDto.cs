namespace AlooGiyah_Application.DTOs.Notification;

public class NotificationPreferencesDto
{
    public bool OrderNotificationsEnabled { get; set; } = true;
    public bool ServiceRequestNotificationsEnabled { get; set; } = true;
    public bool GeneralNotificationsEnabled { get; set; } = true;
}
