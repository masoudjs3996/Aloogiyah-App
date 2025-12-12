using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class VerifyEmailDto
{
    [Required]
    public string Code { get; set; } = string.Empty;
}
