
namespace AlooGiyah_Application.DTOs.Cart
{
    public class CartItemDto
    {

        public string Code { get; set; } = string.Empty;

        public string ProductCode { get; set; } = string.Empty;

        public string ProductName { get; set; } = string.Empty;


        public string ProductSlug { get; set; } = string.Empty;


        public string? ProductImageUrl { get; set; }

        public int Quantity { get; set; }

        public decimal UnitPrice { get; set; }

        public decimal TotalPrice => Quantity * UnitPrice;

        public int AvailableStock { get; set; }
    }
}
