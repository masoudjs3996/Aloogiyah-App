using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class CompleteRefundDto
{
    [Required, StringLength(150, MinimumLength = 3)]
    public string Reference { get; set; } = string.Empty;
}
