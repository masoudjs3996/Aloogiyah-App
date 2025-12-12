
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Product;

public class ProductDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal RetailPrice { get; set; } // قیمت برای مشتری معمولی
    public decimal? WholesalePrice { get; set; } // قیمت برای همکار
    public int Stock { get; set; }
    public List<string> CategoryCodes { get; set; } = new();
    public string Slug { get; set; } = string.Empty;
    public string MetaTitle { get; set; } = string.Empty;
    public string MetaDescription { get; set; } = string.Empty;
    public string? MetaKeywords { get; set; }
}
