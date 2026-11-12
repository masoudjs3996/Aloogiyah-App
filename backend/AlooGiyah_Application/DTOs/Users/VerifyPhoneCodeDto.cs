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

public sealed class SetPhoneCredentialsDto : VerifyPhoneCodeDto
{
    [Required, StringLength(50, MinimumLength = 5)]
    [RegularExpression(@"^\S+$", ErrorMessage = "نام کاربری نباید فاصله داشته باشد.")]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(72, MinimumLength = 8)]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[@$!%*?&])[A-Za-z0-9@$!%*?&]+$",
        ErrorMessage = "رمز باید شامل حرف بزرگ و کوچک انگلیسی، عدد و نشانه باشد.")]
    public string Password { get; set; } = string.Empty;
}
