
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class ResetPasswordDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(@"^\d{6}$")]
    public string ResetCode { get; set; } = string.Empty;

    [Required, StringLength(100, MinimumLength = 6, ErrorMessage = "پسورد باید حداقل 6 کاراکتر باشد.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
      ErrorMessage = "پسورد باید حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص داشته باشد.")]
    public string NewPassword { get; set; } = string.Empty;
}
