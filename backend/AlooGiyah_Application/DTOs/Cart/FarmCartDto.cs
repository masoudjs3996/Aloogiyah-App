
namespace AlooGiyah_Application.DTOs.Cart;

public class FarmCartDto
{
    public string FarmCode { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;

    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }

    public List<CartItemDto> Items { get; set; } = new();
}

