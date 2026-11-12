using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProduct;

public sealed class ProductSpecificationValueInput
{
    [Required, MaxLength(10)]
    public string SpecificationCode { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string OptionCode { get; set; } = string.Empty;
}

public sealed class ProductSpecificationValueDto
{
    public string SpecificationCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string OptionCode { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
}
