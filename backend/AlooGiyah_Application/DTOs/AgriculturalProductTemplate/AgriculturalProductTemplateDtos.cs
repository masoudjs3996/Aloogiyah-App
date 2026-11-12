using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.AgriculturalProductTemplate;

public sealed class ProductTemplateOptionInput
{
    [MaxLength(10)]
    public string? Code { get; set; }

    [Required, MaxLength(100)]
    public string Label { get; set; } = string.Empty;

    [MaxLength(7), RegularExpression("^#[0-9A-Fa-f]{6}$", ErrorMessage = "رنگ گزینه معتبر نیست.")]
    public string? ColorHex { get; set; }
    [MaxLength(12), RegularExpression("^[A-Za-z][A-Za-z0-9]*$", ErrorMessage = "آیکون گزینه معتبر نیست.")]
    public string? Icon { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}

public sealed class ProductTemplateSpecificationInput
{
    [MaxLength(10)]
    public string? Code { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public bool IsRequired { get; set; } = true;
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    [MinLength(1)]
    public List<ProductTemplateOptionInput> Options { get; set; } = [];
}

public sealed class AgriculturalProductTemplateUpsertDto
{
    [Required, MaxLength(10)]
    public string CategoryCode { get; set; } = string.Empty;

    [Required, MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [RegularExpression("^(Kilogram|Package|Piece)$", ErrorMessage = "واحد فروش پیش‌فرض معتبر نیست.")]
    public string? DefaultSaleUnit { get; set; }

    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }

    public List<ProductTemplateSpecificationInput> Specifications { get; set; } = [];
}

public sealed class ProductTemplateOptionDto
{
    public string Code { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
}

public sealed class ProductTemplateSpecificationDto
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public bool IsRequired { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public List<ProductTemplateOptionDto> Options { get; set; } = [];
}

public sealed class AgriculturalProductTemplateDto
{
    public string Code { get; set; } = string.Empty;
    public string CategoryCode { get; set; } = string.Empty;
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? DefaultSaleUnit { get; set; }
    public bool IsActive { get; set; }
    public int SortOrder { get; set; }
    public List<ProductTemplateSpecificationDto> Specifications { get; set; } = [];
}
