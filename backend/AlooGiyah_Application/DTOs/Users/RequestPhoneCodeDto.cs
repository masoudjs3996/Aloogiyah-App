using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Users;

public class RequestPhoneCodeDto
{
    [Required]
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Login|Register)$", ErrorMessage = "نوع درخواست معتبر نیست.")]
    public string Purpose { get; set; } = string.Empty;

    [MaxLength(80)]
    public string? FName { get; set; }

    [MaxLength(150)]
    public string? LName { get; set; }
}
