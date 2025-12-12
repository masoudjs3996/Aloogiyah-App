using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Warehouse;

public class WarehouseFilterDto : BaseFilterDto
{
    public string? Name { get; set; }
    public string? FarmerCode { get; set; }
}
