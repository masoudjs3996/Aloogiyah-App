using AlooGiyah_Application.Commons;
using AlooGiyah_Application.DTOs.Notification;
using AlooGiyah_Application.Interfaces.Service;
using AlooGiyah_Shared.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace AlooGiyah_Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;

        public NotificationController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // دریافت همه اعلان‌های کاربر جاری
        [Authorize(Policy = "NotGuest")]
        [HttpGet("MyNotifications")]
        public async Task<IActionResult> GetMyNotifications()
        {
            var notifications = await _notificationService.GetMyNotificationsAsync();
            return Ok(new ApiResponse<object>
            {
                IsSuccess = true,
                Message = "لیست اعلان‌های شما",
                Data = notifications
            });
        }

        // دریافت یک اعلان با شناسه (در صورت تعلق به کاربر جاری)
        [Authorize(Policy = "NotGuest")]
        [HttpGet("GetMyNotificationByCode")]
        public async Task<IActionResult> GetMyNotificationByCode([FromQuery]string notificationCode)
        {
            try
            {
                var notification = await _notificationService.GetMyNotificationByCodeAsync(notificationCode);
                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "جزئیات اعلان",
                    Data = notification
                });
            }
            catch (Exception ex) when (ex is NotFoundException || ex is UnauthorizedAccessException)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = ex.Message });
            }
        }

        // علامت‌گذاری یک اعلان به عنوان خوانده‌شده
        [Authorize(Policy = "NotGuest")]
        [HttpPut("Read")]
        public async Task<IActionResult> MarkAsRead(string notificationCode)
        {
            try
            {
                await _notificationService.MarkAsReadAsync(notificationCode);
                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "اعلان به عنوان خوانده‌شده علامت‌گذاری شد"
                });
            }
            catch (Exception ex) when (ex is NotFoundException || ex is UnauthorizedAccessException)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = ex.Message });
            }
        }

        //// علامت‌گذاری همه اعلان‌های کاربر جاری به عنوان خوانده‌شده
        //[Authorize(Policy = "NotGuest")]
        //[HttpPut("MarkAllAsRead")]
        //public async Task<IActionResult> MarkAllAsRead()
        //{
        //    await _notificationService.MarkAllAsReadAsync();
        //    return Ok(new ApiResponse<object>
        //    {
        //        IsSuccess = true,
        //        Message = "همه اعلان‌ها به عنوان خوانده‌شده علامت‌گذاری شدند"
        //    });
        //}

        // حذف یک اعلان (در صورت مالکیت)
        [Authorize(Policy = "NotGuest")]
        [HttpDelete("DeleteNotification")]
        public async Task<IActionResult> DeleteNotification([FromQuery] string notificationCode)
        {
            try
            {
                await _notificationService.DeleteNotificationAsync(notificationCode);
                return Ok(new ApiResponse<object>
                {
                    IsSuccess = true,
                    Message = "اعلان با موفقیت حذف شد"
                });
            }
            catch (Exception ex) when (ex is NotFoundException || ex is UnauthorizedAccessException)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = ex.Message });
            }
        }

        // دریافت تعداد اعلان‌های خوانده‌نشده
        //[Authorize(Policy = "NotGuest")]
        //[HttpGet("UnreadCount")]
        //public async Task<IActionResult> GetUnreadCount()
        //{
        //    var count = await _notificationService.GetUnreadCountAsync();
        //    return Ok(new ApiResponse<object>
        //    {
        //        IsSuccess = true,
        //        Message = "تعداد اعلان‌های خوانده‌نشده",
        //        Data = new { UnreadCount = count }
        //    });
        //}

        // ایجاد اعلان جدید (فقط ادمین)
        [Authorize(Roles = "Admin,Manager")]
        [HttpPost("CreateNotification")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = "داده‌های ورودی نامعتبر است" });

            try
            {
                var notificationDto = await _notificationService.CreateNotificationAsync(dto);
                return Ok(new ApiResponse<NotificationDto>
                {
                    IsSuccess = true,
                    Message = "اعلان با موفقیت ایجاد شد",
                    Data = notificationDto
                });
            }
            catch (NotFoundException ex)
            {
                return BadRequest(new ApiResponse<object> { IsSuccess = false, Message = ex.Message });
            }
        }
    }
}

