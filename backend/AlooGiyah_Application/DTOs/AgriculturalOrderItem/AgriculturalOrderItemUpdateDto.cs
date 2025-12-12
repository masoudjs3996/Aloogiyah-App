
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalOrderItem;

public class AgriculturalOrderItemUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    public string? AgriculturalProductCode { get; set; }

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Required]
    [Range(0.01, double.MaxValue)]
    public decimal Price { get; set; }
}
