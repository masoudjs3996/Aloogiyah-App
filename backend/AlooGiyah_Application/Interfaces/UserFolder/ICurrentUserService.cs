using System.Security.Claims;

namespace AlooGiyah_Application.Interfaces.UserFolder;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    string? UserCode { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
    string? CartId { get; set; }
    bool IsGuest { get; }

}
