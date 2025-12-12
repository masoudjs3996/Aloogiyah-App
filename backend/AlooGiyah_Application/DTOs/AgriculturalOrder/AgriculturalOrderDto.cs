using AlooGiyah_Application.DTOs.AgriculturalOrderItem;
namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class AgriculturalOrderDto
{
    public string Code { get; set; } = string.Empty;
    public string StatusCode { get; set; } = string.Empty;
    public string BuyerCode { get; set; } = string.Empty;
    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public bool IsPaid { get; set; }
    public bool IsHeld { get; set; }
    public decimal HeldAmount { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<AgriculturalOrderItemDto> OrderItems { get; set; } = new();
}
