namespace AlooGiyah_Application.DTOs.Users;

using System.ComponentModel.DataAnnotations;

public class LoginDto
{
    private string _username = string.Empty;
    private string _password = string.Empty;

    [Required(ErrorMessage = "نام کاربری الزامی است.")]
    [RegularExpression(@"^\S+$", ErrorMessage = "نام کاربری نباید فاصله داشته باشد.")]
    public string Username { get => _username; set => _username = value?.Trim() ?? string.Empty; }

    [Required(ErrorMessage = "رمز عبور الزامی است.")]
    [RegularExpression(@"^\S+$", ErrorMessage = "رمز عبور نباید فاصله داشته باشد.")]
    public string Password { get => _password; set => _password = value?.Trim() ?? string.Empty; }
}
