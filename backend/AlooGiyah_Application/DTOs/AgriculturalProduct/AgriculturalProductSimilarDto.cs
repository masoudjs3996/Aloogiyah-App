
namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductSimilarDto
{
        public string? SaleUnit { get; set; }

    public decimal? DiscountPercentage { get; set; }
    public DateTimeOffset? DiscountEndsAt { get; set; }
    public decimal? DiscountedRetailPrice { get; set; }
    public decimal? DiscountedWholesalePrice { get; set; }
    public required string Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public string PrimaryImageUrl { get; set; } = "/placeholder.svg";
}
