using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;
public class CheckoutDiscountPreviewInput
{
    [Required] public Guid? CartId { get; set; }
    [Required, MaxLength(100)] public string DiscountCode { get; set; } = string.Empty;
}
public class CheckoutDiscountPreviewDto
{
    public string DiscountCode { get; set; } = string.Empty;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PayableAmount { get; set; }
}
