
namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductSimilarDto
{
    public required string Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public string PrimaryImageUrl { get; set; } = "/placeholder.svg";
}
