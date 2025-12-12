using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.Product;

public class ProductFilterDto : BaseFilterDto
{
    public string? SearchTerm { get; set; }
    public string? ProductTypeCode { get; set; }
    public string? CategoryCode { get; set; }
}
