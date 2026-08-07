
namespace AlooGiyah_Application.DTOs.Cart;

public class FarmCartDto
{
    public string FarmCode { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;

    public decimal TotalPrice { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? ImageUrl { get; set; }
    public string Province { get; set; } = string.Empty ;
    public string County { get; set; } = string.Empty;
    public List<CartItemDto> Items { get; set; } = new();
}

