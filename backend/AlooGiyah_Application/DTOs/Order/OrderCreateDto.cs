using AlooGiyah_Application.DTOs.OrderItem;

namespace AlooGiyah_Application.DTOs.Order;

public class OrderCreateDto
{
    public string StatusCode { get; set; } = string.Empty;
    public string? AddressCode { get; set; }
    public string? DiscountCode { get; set; }
    public List<OrderItemCreateDto> Items { get; set; } = null!;
}
    