
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalOrderItem;

public class AgriculturalOrderItemCreateDto
{
    [Required]
    public string AgriculturalProductCode { get; set; } = string.Empty;

    [Required]
    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

}
