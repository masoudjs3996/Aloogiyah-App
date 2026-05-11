using AlooGiyah_Application.DTOs.Notification;

namespace AlooGiyah_Application.Interfaces.Service;

public interface INotificationService
{
    Task<List<NotificationDto>> GetMyNotificationsAsync();
    Task<NotificationDto> GetMyNotificationByCodeAsync(string Code);
    Task MarkAsReadAsync(string Code);
    //Task MarkAllAsReadAsync();
    Task DeleteNotificationAsync(string Code);
    Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);
    //Task<int> GetUnreadCountAsync();
}
