namespace AlooGiyah_Application.DTOs.AgriculturalOrderItem;

public class AgriculturalOrderItemDto
{
    public string? SaleUnit { get; set; }

    public string Code { get; set; } = string.Empty;
    public string AgriculturalProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductSlug { get; set; } = string.Empty;
    public decimal LineTotal { get; set; }
    public int Quantity { get; set; }
    public int ReceivedAtOriginQuantity { get; set; }
    public int ReceivedAtHubQuantity { get; set; }
    public int DeliveredQuantity { get; set; }
    public decimal Price { get; set; }
}
