
namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductListItemDto
{
        public string? SaleUnit { get; set; }

    public decimal? DiscountPercentage { get; set; }
    public DateTimeOffset? DiscountEndsAt { get; set; }
    public decimal? DiscountedRetailPrice { get; set; }
    public decimal? DiscountedWholesalePrice { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int Stock { get; set; }
    public string FarmCode { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; } = string.Empty; // فقط عکس اصلی
    public DateTimeOffset CreatedAt { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public bool IsSellable { get; set; }
}
