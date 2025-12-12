using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.AgriculturalOrderItem;

public class AgriculturalOrderItemFilterDto : BaseFilterDto
{
    public string? OrderCode { get; set; }
    public string? ProductCode { get; set; }
    public int? MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
}