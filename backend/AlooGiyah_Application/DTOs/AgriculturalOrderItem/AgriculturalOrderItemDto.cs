namespace AlooGiyah_Application.DTOs.AgriculturalOrderItem;

public class AgriculturalOrderItemDto
{
    public string Code { get; set; } = string.Empty;
    public string AgriculturalProductCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}
