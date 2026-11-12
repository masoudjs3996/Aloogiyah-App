using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductSimilarFilterDto : BaseFilterDto
{
    public string ProductCode { get; set; } = string.Empty;
}
