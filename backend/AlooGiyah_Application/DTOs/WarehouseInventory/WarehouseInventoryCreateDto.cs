
using System.ComponentModel.DataAnnotations;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.WarehouseInventory;

public class WarehouseInventoryCreateDto
{
    [Required]
    public string WarehouseCode { get; set; } = string.Empty;

    [Required]
    public string EntityCode { get; set; } = string.Empty;

    [Required]
    public EntityWarehouseInventory EntityWarehouse { get; set; }

    [Required]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; }

    public DateTimeOffset? LastRestockDate { get; set; }
}
