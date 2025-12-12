
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.WarehouseInventory;

public class WarehouseInventoryUpdateDto
{
    [Required]
    public string Code { get; set; } = string.Empty;

    [Required]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    public DateTimeOffset? LastRestockDate { get; set; }
}
