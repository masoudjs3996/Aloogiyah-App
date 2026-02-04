
namespace AlooGiyah_Application.DTOs.Cart;

public class CartDto
{
    public Guid CartId { get; set; }
    public string Code { get; set; } = string.Empty;

    public List<FarmCartDto> Farms { get; set; } = new();

    public int ItemCount => Farms.Sum(f => f.Items.Sum(i => i.Quantity));
    public decimal TotalPrice => Farms.Sum(f => f.TotalPrice);

    public bool IsGuest { get; set; }
}

