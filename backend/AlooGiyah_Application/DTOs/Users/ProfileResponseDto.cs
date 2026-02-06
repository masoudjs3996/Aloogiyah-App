
namespace AlooGiyah_Application.DTOs.Users;

public class ProfileResponseDto
{
    public bool IsGuest { get; set; }
    public Guid? CartId { get; set; }
    public UserDto? User { get; set; }
}
