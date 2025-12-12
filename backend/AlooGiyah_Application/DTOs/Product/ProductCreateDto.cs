using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.Product;

public class ProductCreateDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    [Required]
    public decimal RetailPrice { get; set; } // قیمت برای مشتری معمولی
    public decimal WholesalePrice { get; set; }
    public int Stock { get; set; }
    public List<string> CategoryCodes { get; set; } = new();

    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }
}
