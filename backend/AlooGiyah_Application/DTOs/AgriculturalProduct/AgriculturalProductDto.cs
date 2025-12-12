using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; }
    public decimal? WholesalePrice { get; set; }
    public int Stock { get; set; }
    public string GreenhouseCode { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public string? MetaKeywords { get; set; }
    public int? DailyProductionCapacity { get; set; }
    public string StatusCode { get; set; } = string.Empty;
    public List<string> CategoryCodes { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
}
