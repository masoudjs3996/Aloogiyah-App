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

    public string? UserCode => _httpContextAccessor.HttpContext?
        .User?.FindFirstValue("Code");

    public string? UserName =>
        _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;

    public IEnumerable<string> Roles =>
        _httpContextAccessor.HttpContext?.User?.FindAll(ClaimTypes.Role).Select(c => c.Value) ?? Enumerable.Empty<string>();

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}


