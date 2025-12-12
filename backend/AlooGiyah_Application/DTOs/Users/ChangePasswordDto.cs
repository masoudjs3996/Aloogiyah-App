
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class ChangePasswordDto
{
    public required string CurrentPassword { get; set; }
    [Required(ErrorMessage = "پسورد الزامی است.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "پسورد باید حداقل 6 کاراکتر باشد.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
       ErrorMessage = "پسورد باید حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص داشته باشد.")]
    public required string NewPassword { get; set; }
}
