using AlooGiyah_Application.Interfaces.Query;
using AlooGiyah_Application.DTOs.Notification;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Domain.Entities;
using AlooGiyah_Domain.Entities.UserFolder;
using AlooGiyah_Domain.Interfaces;
using AlooGiyah_Shared.Exceptions;
using AutoMapper;


namespace AlooGiyah_Application.Services
{
    public class NotificationService : INotificationService
    {
    private readonly INotificationQuery _readQuery;

        private readonly IGenericRepository<Notification> _notificationRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public NotificationService(INotificationQuery readQuery,
        IGenericRepository<Notification> notificationRepository,
            IGenericRepository<User> userRepository,
            ICurrentUserService currentUserService,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
        _readQuery = readQuery;
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _currentUserService = currentUserService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<NotificationDto>> GetMyNotificationsAsync()
        {
        return await _readQuery.GetMyNotificationsAsync();
    }

        public async Task<NotificationDto> GetMyNotificationByCodeAsync(string Code)
        {
        return await _readQuery.GetMyNotificationByCodeAsync(Code) ?? throw new NotFoundException("اعلان یافت نشد.");
    }

        public async Task MarkAsReadAsync(string Code)
        {
            var userId = GetCurrentUserId();
            var notification = await _notificationRepository.GetByCodeAsync(Code);

            if (notification == null)
                throw new NotFoundException("اعلان یافت نشد");

            if (notification.UserId != userId)
                throw new UnauthorizedAccessException("شما مجاز به تغییر این اعلان نیستید");

            notification.IsRead = true;
            await _notificationRepository.UpdateAsync(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        //public async Task MarkAllAsReadAsync()
        //{
        //    var userId = GetCurrentUserId();
        //    var unreadNotifications = await _notificationRepository
        //        .GetAllAsync(n => n.UserId == userId && !n.IsRead);

        //    if (unreadNotifications.Any())
        //    {
        //        foreach (var notification in unreadNotifications)
        //        {
        //            notification.IsRead = true;
        //        }
        //        await _unitOfWork.SaveChangesAsync();
        //    }
        //}

        public async Task DeleteNotificationAsync(string Code)
        {
            var userId = GetCurrentUserId();
            var notification = await _notificationRepository.GetByCodeAsync(Code);

            if (notification == null)
                throw new NotFoundException("اعلان یافت نشد");

            if (notification.UserId != userId)
                throw new UnauthorizedAccessException("شما مجاز به حذف این اعلان نیستید");

            await _notificationRepository.DeleteAsync(notification);
            await _unitOfWork.SaveChangesAsync();
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            // امنیت: این متد می‌تواند در کنترلر با Authorize(Roles="Admin") محافظت شود
            // در اینجا فقط ولیدیشن اولیه انجام می‌شود
            var notification = new Notification
            {
                UserId = null,
                IsPublic = string.IsNullOrWhiteSpace(dto.UserCode),
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false
            };

            if (!notification.IsPublic)
            {
                var user = await _userRepository.GetByCodeAsync(dto.UserCode!);
                if (user == null)
                    throw new NotFoundException("کاربر مقصد یافت نشد");

                notification.UserId = user.UserId;
            }

            await _notificationRepository.AddAsync(notification);
            await _unitOfWork.SaveChangesAsync();

            return _mapper.Map<NotificationDto>(notification);
        }

        //public async Task<int> GetUnreadCountAsync()
        //{
        //    var userId = GetCurrentUserId();
        //    var count = await _notificationRepository
        //        .CountAsync(n => n.UserId == userId && !n.IsRead); // فرض وجود CountAsync در ریپازیتوری
        //    return count;
        //}

        private int GetCurrentUserId()
        {
            if (string.IsNullOrEmpty(_currentUserService.UserId))
                throw new UnauthorizedAccessException("کاربر احراز هویت نشده است");

            return int.Parse(_currentUserService.UserId);
        }
    }
}
