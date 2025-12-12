using System.ComponentModel.DataAnnotations;
using AlooGiyah_Application.DTOs.AgriculturalOrderItem;

namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class AgriculturalOrderUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;
    public string? StatusCode { get; set; }
    public string? AddressCode { get; set; }
    public string? DiscountCode { get; set; }
    public bool? IsPaid { get; set; }
    public DateTimeOffset? PaymentDate { get; set; }
    public string? PaymentReference { get; set; }
    public List<AgriculturalOrderItemUpdateDto> OrderItems { get; set; } = new();
}

