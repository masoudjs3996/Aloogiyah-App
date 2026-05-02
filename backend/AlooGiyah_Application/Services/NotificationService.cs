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
        private readonly IGenericRepository<Notification> _notificationRepository;
        private readonly IGenericRepository<User> _userRepository;
        private readonly ICurrentUserService _currentUserService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public NotificationService(
            IGenericRepository<Notification> notificationRepository,
            IGenericRepository<User> userRepository,
            ICurrentUserService currentUserService,
            IUnitOfWork unitOfWork,
            IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _currentUserService = currentUserService;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<List<NotificationDto>> GetMyNotificationsAsync()
        {
            var userId = GetCurrentUserId();
            var pagedResult = await _notificationRepository.GetPagedAsync(n => n.UserId == userId);
            var notifications = pagedResult.Items; // یا pagedResult.Data با توجه به تعریف کلاس PagedResult
            return _mapper.Map<List<NotificationDto>>(notifications);
        }

        public async Task<NotificationDto> GetMyNotificationByCodeAsync(string Code)
        {
            var userId = GetCurrentUserId();
            var notification = await _notificationRepository.GetByCodeAsync(Code);

            if (notification == null)
                throw new NotFoundException("اعلان یافت نشد");

            if (notification.UserId != userId)
                throw new UnauthorizedAccessException("شما مجاز به مشاهده این اعلان نیستید");

            return _mapper.Map<NotificationDto>(notification);
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
            var user = await _userRepository.GetByCodeAsync(dto.UserCode); // فرض وجود متد AnyAsync در ریپازیتوری
            if (user == null)
                throw new NotFoundException("کاربر مقصد یافت نشد");

            

            var notification = new Notification
            {
                UserId = user.UserId,
                Message = dto.Message,
                Type = dto.Type,
                IsRead = false
            };

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

