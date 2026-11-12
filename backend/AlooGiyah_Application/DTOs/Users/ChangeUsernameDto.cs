
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class ChangeUsernameDto
{
    private string _newUsername = string.Empty;

    [Required(ErrorMessage = "یوزرنیم فعلی الزامی است.")]
    public required string CurrentUsername { get; set; }
    [Required(ErrorMessage = "یوزرنیم الزامی است.")]
    [StringLength(50, MinimumLength = 5, ErrorMessage = "یوزرنیم باید حداقل 5 کاراکتر و حداکثر 50 کاراکتر باشد.")]
    [RegularExpression(@"^\S+$", ErrorMessage = "نام کاربری نباید فاصله داشته باشد.")]
    public required string NewUsername { get => _newUsername; set => _newUsername = value?.Trim() ?? string.Empty; }
    [Required(ErrorMessage = "پسورد الزامی است.")]
    public required string Password { get; set; }
}
