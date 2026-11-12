using AlooGiyah_Domain.Entities;

namespace AlooGiyah_Application.Interfaces.Service;

public interface INotificationWriter
{
    Task<Notification?> AddForUserAsync(int userId, string type, string message);
}
