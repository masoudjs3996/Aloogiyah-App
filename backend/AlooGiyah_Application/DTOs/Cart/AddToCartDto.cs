using System.ComponentModel.DataAnnotations;


namespace AlooGiyah_Application.DTOs.Cart;

public class AddToCartDto
{

    [Required]
    public string ProductCode { get; set; } = string.Empty;

    public int Quantity { get; set; } = 1;
}
