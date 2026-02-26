using AlooGiyah_Application.Interfaces.Service.UserFolder;
using AlooGiyah_Shared.Exceptions;
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

    // Helper جدید برای راحتی (اختیاری اما توصیه می‌کنم)
    public int? GetUserIdAsInt()
    {
        var idStr = UserId;
        return string.IsNullOrEmpty(idStr) ? null : int.TryParse(idStr, out int id) ? id : null;
    }

    // اگر می‌خوای exception بیندازه اگر parse نشد
    public int GetRequiredUserIdAsInt()
    {
        var id = GetUserIdAsInt();
        if (id == null)
            throw new UnauthorizedException("شناسه کاربر در توکن یافت نشد یا نامعتبر است.");

        return id.Value;
    }

    public string? UserCode =>
        _httpContextAccessor.HttpContext?.User?.FindFirstValue("Code");

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;

    public IEnumerable<string> Roles =>
        _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value)
        ?? Enumerable.Empty<string>();

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;

    // کلید اصلی: تشخیص نوع کاربر بر اساس رول
    public bool IsGuest => Roles.Contains("Guest");

    public string? CartId =>
         IsGuest
             ? _httpContextAccessor.HttpContext?.User?.FindFirstValue("cartId")
             : null;

    public string? GuestCartId =>
     _httpContextAccessor.HttpContext?
         .User?
         .FindFirst("cartId")?
         .Value;

    public void ClearGuestCartId()
    {
        if (_httpContextAccessor.HttpContext != null)
        {
            _httpContextAccessor.HttpContext.Response.Cookies.Delete("GuestCartId");
        }
    }


}