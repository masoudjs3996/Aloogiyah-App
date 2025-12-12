using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.OrderItem;

public class OrderItemUpdateDto
{
    [Required]
    public string OrderItemCode { get; set; } = string.Empty;
    [Required]
    public string ProductCode { get; set; } = string.Empty;
    [Required]
    public int Quantity { get; set; }
}
