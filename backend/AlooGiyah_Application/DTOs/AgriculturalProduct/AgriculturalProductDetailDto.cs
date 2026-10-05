
namespace AlooGiyah_Application.DTOs.AgriculturalProduct
{
    public class AgriculturalProductDetailDto : AgriculturalProductListItemDto
    {
        public int? DailyProductionCapacity { get; set; }
        public string? MetaTitle { get; set; } = string.Empty;
        public string? MetaDescription { get; set; } = string.Empty;
        public string? MetaKeywords { get; set; }
        public List<string> CategoryCodes { get; set; } = new();

        public List<string>? ImageUrls { get; set; } 
    }
}
