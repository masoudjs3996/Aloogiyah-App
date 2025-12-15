using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public class AgriculturalProductCreateDto
{
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string Description { get; set; } = string.Empty;
    
    [MaxLength(10)]
    public string FarmCode { get; set; } = string.Empty;

    [Required]
    public decimal RetailPrice { get; set; }
    public decimal? WholesalePrice { get; set; }

    [Required]
    public int Stock { get; set; }

    public int? DailyProductionCapacity { get; set; }

    [Required]
    public string StatusCode { get; set; } = string.Empty;

    [MaxLength(255)]
    public string Slug { get; set; } = string.Empty;

    [MaxLength(255)]
    public string MetaTitle { get; set; } = string.Empty;

    [MaxLength(500)]
    public string MetaDescription { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? MetaKeywords { get; set; }

    public List<string> CategoryCodes { get; set; } = new();

    public List<IFormFile>? Images { get; set; } = new();
}
