using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class CheckoutFromCartDto
{
    [Required]
    public string AddressCode { get; set; } = string.Empty;

    public string? DiscountCode { get; set; }
}
