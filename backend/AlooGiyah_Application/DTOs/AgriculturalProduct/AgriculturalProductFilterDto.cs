using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductFilterDto : BaseFilterDto
{
    public string? Name { get; set; }
    public string? StatusCode { get; set; }
    public string? FarmCode { get; set; } 
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public int? MinStock { get; set; }
    public int? MaxStock { get; set; }
    public List<string>? CategoryCodes { get; set; }
}