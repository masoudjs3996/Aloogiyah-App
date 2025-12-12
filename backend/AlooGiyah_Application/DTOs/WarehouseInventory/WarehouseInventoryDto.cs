using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.WarehouseInventory;

public class WarehouseInventoryDto
{
    public string Code { get; set; } = string.Empty;
    public string WarehouseCode { get; set; } = string.Empty;
    public string EntityCode { get; set; } = string.Empty;
    public EntityWarehouseInventory EntityWarehouse { get; set; }
    public int Quantity { get; set; }
    public DateTimeOffset? LastRestockDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
}
