using AlooGiyah_Application.DTOs.BaseDto;
using AlooGiyah_Domain.Enums;

namespace AlooGiyah_Application.DTOs.WarehouseInventory;

public class WarehouseInventoryFilterDto : BaseFilterDto
{
    public string? WarehouseCode { get; set; }
    public string? EntityCode { get; set; }
    public EntityWarehouseInventory? EntityWarehouse { get; set; }
    public int? MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public DateTimeOffset? LastRestockFrom { get; set; }
    public DateTimeOffset? LastRestockTo { get; set; }
}