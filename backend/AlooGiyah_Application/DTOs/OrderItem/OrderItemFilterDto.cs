using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.OrderItem;

public class OrderItemFilterDto : BaseFilterDto
{
    public string? OrderCode { get; set; }
    public string? ProductCode { get; set; }
    public string? SearchTerm { get; set; }
}
