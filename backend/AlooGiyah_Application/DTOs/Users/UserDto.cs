
namespace AlooGiyah_Application.DTOs.Users;

public class UserDto
{
    public string Code { get; set; } = string.Empty;
    public string FName { get; set; } = string.Empty;
    public string? LName { get; set; }
    public string? Email { get; set; }
    public string UserName { get; set; } = string.Empty;
    public bool IsEmailConfirmed { get; set; }
    public int Age { get; set; }
    public string RoleCode { get; set; } = string.Empty;
    public string RoleName {  get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; } 
    public DateTimeOffset? UpdatedAt { get; set; }
    public string? ProfileImageUrl { get; set; }

}
