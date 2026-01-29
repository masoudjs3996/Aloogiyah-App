using AlooGiyah_Application.Interfaces.UserFolder;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace AlooGiyah_Application.Services.UserFolder;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
    }

    public string? UserId =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

    public string? UserCode =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue("Code");

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;

    public IEnumerable<string> Roles =>
        _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
        ?? Enumerable.Empty<string>();

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    // برای کاربران لاگین‌شده: از claim (اختیاری)
    // برای مهمان‌ها: از کوکی می‌خوانیم / می‌نویسیم
    public string? CartId
    {
        get
        {
            // اولویت مطلق: اگر کاربر احراز هویت شده (لاگین کرده)، هیچ‌وقت کوکی مهمان را برنگردان
            if (IsAuthenticated)
                return null;

            // فقط وقتی واقعاً مهمان هستیم (نه لاگین، نه توکن معتبر کاربر)
            return _httpContextAccessor.HttpContext?.Request.Cookies["GuestCartId"];
        }
        set
        {
            if (string.IsNullOrEmpty(value))
            {
                // پاک کردن کوکی
                _httpContextAccessor.HttpContext?.Response.Cookies.Delete("GuestCartId");
                return;
            }

            var options = new CookieOptions
            {
                HttpOnly = true,
                Secure = _httpContextAccessor.HttpContext?.Request.IsHttps ?? false,
                SameSite = SameSiteMode.Lax,
                Expires = DateTimeOffset.UtcNow.AddDays(30)
            };

            _httpContextAccessor.HttpContext?.Response.Cookies.Append("GuestCartId", value, options);
        }
    }

    // متد کمکی: آیا کاربر مهمان است؟
    public bool IsGuest => !IsAuthenticated && !string.IsNullOrEmpty(CartId);
}