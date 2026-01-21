
namespace AlooGiyah_Application.DTOs.Users;

public class ProfileResponseDto
{
    public bool IsGuest { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? GuestToken { get; set; }
    public Guid? CartId { get; set; }
    public UserDto? User { get; set; }
}
