

namespace AlooGiyah_Application.Interfaces.Service.UserFolder;

public interface ICurrentUserService
{
    string? UserId { get; }
    string? UserName { get; }
    string? UserCode { get; }
    IEnumerable<string> Roles { get; }
    bool IsAuthenticated { get; }
    string? CartId { get; }
    bool IsGuest { get; }
    public string? GuestCartId { get; }

    void ClearGuestCartId();  // اضافه کردن متد
}
