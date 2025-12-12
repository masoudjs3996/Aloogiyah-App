namespace AlooGiyah_Application.DTOs.OrderItem;

public class OrderItemDto
{

    public string OrderItemCode { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public string PriceType { get; set; } = string.Empty;

    public string OrderCode { get; set; } = string.Empty;
}
