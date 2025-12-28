using System.ComponentModel.DataAnnotations;


namespace AlooGiyah_Application.DTOs.Cart;

public class UpdateCartItemDto
{
    [Required]
    public Guid CartId { get; set; } // Guid نگه دار (امن هست)

    [Required]
    public string ItemCode { get; set; } = string.Empty; // به جای int cartItemId

    [Required]
    public int Quantity { get; set; }
}
