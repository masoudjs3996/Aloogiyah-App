using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Users;

public class UserFilterDto : BaseFilterDto
{
    public string? FName { get; set; }
    public string? LName { get; set; }
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? RoleCode { get; set; }
}
