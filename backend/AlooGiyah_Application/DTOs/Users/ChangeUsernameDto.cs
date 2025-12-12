
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class ChangeUsernameDto
{

    [Required(ErrorMessage = "یوزرنیم فعلی الزامی است.")]
    public required string CurrentUsername { get; set; }
    [Required(ErrorMessage = "یوزرنیم الزامی است.")]
    [StringLength(50, MinimumLength = 5, ErrorMessage = "یوزرنیم باید حداقل 5 کاراکتر و حداکثر 50 کاراکتر باشد.")]
    public required string NewUsername { get; set; }
    [Required(ErrorMessage = "پسورد الزامی است.")]
    public required string Password { get; set; }
}
