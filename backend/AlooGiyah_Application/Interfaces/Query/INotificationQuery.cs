using AlooGiyah_Application.DTOs.Notification;
using AlooGiyah_Domain.Pagination;
namespace AlooGiyah_Application.Interfaces.Query;
public interface INotificationQuery
{
    Task<List<NotificationDto>> GetMyNotificationsAsync();
    Task<NotificationDto?> GetMyNotificationByCodeAsync(string code);
}
