using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class RegisterUserDto
{
    private string _userName = string.Empty;
    private string _password = string.Empty;

    [Required(ErrorMessage = "یوزرنیم الزامی است.")]
    [StringLength(50, MinimumLength = 5, ErrorMessage = "یوزرنیم باید حداقل 5 کاراکتر و حداکثر 50 کاراکتر باشد.")]
    [RegularExpression(@"^\S+$", ErrorMessage = "نام کاربری نباید فاصله داشته باشد.")]
    public string UserName { get => _userName; set => _userName = value?.Trim() ?? string.Empty; }
    [Required(ErrorMessage = "پسورد الزامی است.")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "پسورد باید حداقل 6 کاراکتر باشد.")]
    [RegularExpression(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$",
       ErrorMessage = "رمز عبور باید بدون فاصله و شامل حداقل یک حرف بزرگ، یک حرف کوچک، یک عدد و یک کاراکتر خاص باشد.")]
    public string Password { get => _password; set => _password = value?.Trim() ?? string.Empty; }
    public string FName { get; set; } = string.Empty;
    public string LName { get; set; } = string.Empty;
    
}
