using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class VerifyPhoneCodeDto
{
    [Required]
    public string ChallengeCode { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^\\d{6}$", ErrorMessage = "کد باید شش رقم باشد.")]
    public string Code { get; set; } = string.Empty;
}
