using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Cart;

public class RemoveCartItemDto
{
    [Required]
    public Guid CartId { get; set; }

    [Required]
    public string ItemCode { get; set; } = string.Empty;
}
