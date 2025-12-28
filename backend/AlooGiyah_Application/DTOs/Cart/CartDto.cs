
namespace AlooGiyah_Application.DTOs.Cart;

public class CartDto
{

    public Guid CartId { get; set; }

    public   string Code { get; set; }
    public int ItemCount { get; set; } = 0;

    public decimal TotalPrice { get; set; } = 0;


    public decimal SubtotalPrice { get; set; } = 0;

    public decimal DiscountAmount { get; set; } = 0;


    public List<CartItemDto> CartItems { get; set; } = new List<CartItemDto>();

    public bool IsGuest { get; set; } = true;
}
