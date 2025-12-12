using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.AgriculturalOrder;

public class AgriculturalOrderFilterDto : BaseFilterDto
{
    public string? StatusCode { get; set; }
    public decimal? MinTotalPrice { get; set; }
    public decimal? MaxTotalPrice { get; set; }
    public string? UserCode { get; set; }
    public DateTimeOffset? StartDate { get; set; }
    public DateTimeOffset? EndDate { get; set; }
    public string? ProductCode { get; set; }

}
