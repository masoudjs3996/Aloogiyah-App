using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class CheckoutFromCartDto
{
    [Required] public string AddressCode { get; set; } = string.Empty;
    public string? DiscountCode { get; set; }
    [Required] public Guid? CartId { get; set; }
    [Required, StringLength(100, MinimumLength = 8)]
    public string IdempotencyKey { get; set; } = string.Empty;
}
