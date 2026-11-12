using AlooGiyah_Shared.Constants;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AlooGiyah_Application.Services;

public sealed class NotificationWriter : INotificationWriter
{
    private readonly IGenericRepository<User> _users;
    private readonly IGenericRepository<Notification> _notifications;

    public NotificationWriter(
        IGenericRepository<User> users,
        IGenericRepository<Notification> notifications)
    {
        _users = users;
        _notifications = notifications;
    }

    public async Task<Notification?> AddForUserAsync(int userId, string type, string message)
    {
        type = NotificationTypes.Localize(type);
        var user = await _users.GetAll().SingleOrDefaultAsync(candidate => candidate.UserId == userId);
        if (user == null || !IsEnabled(user, type))
            return null;

        var notification = new Notification
        {
            UserId = userId,
            IsPublic = false,
            IsRead = false,
            Type = type.Length > 50 ? type[..50] : type,
            Message = message.Length > 1000 ? message[..1000] : message
        };
        await _notifications.AddAsync(notification);
        return notification;
    }

    private static bool IsEnabled(User user, string type)
    {
        if (type.StartsWith("درخواست خدمات", StringComparison.Ordinal) ||
            type.StartsWith("ServiceRequest", StringComparison.Ordinal))
            return user.ReceiveServiceRequestNotifications;

        if (type.StartsWith("سفارش", StringComparison.Ordinal) ||
            type.StartsWith("خرید", StringComparison.Ordinal) ||
            type.StartsWith("Order", StringComparison.Ordinal) ||
            type.StartsWith("FarmOrder", StringComparison.Ordinal) ||
            type.StartsWith("Checkout", StringComparison.Ordinal))
            return user.ReceiveOrderNotifications;

        return user.ReceiveGeneralNotifications;
    }
}
