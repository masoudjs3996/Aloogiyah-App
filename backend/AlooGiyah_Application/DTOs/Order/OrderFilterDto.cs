using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Order;

public class OrderFilterDto : BaseFilterDto
{
    public string? StatusCode { get; set; }
    public string? SearchTerm { get; set; }
    public string? UserCode { get; set; }
}
