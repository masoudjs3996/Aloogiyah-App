using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class UpdateProfileDto
{
    public string FName { get; set; } = string.Empty;
    public string LName { get; set; } = string.Empty;
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

}
