using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.ProductInquiry;

public sealed class ProductInquiryCreateDto
{
    [Required, MaxLength(10)]
    public string ProductCode { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [MaxLength(1000)]
    public string? Message { get; set; }
}

public sealed class ProductInquiryActionDto
{
    [Required, MaxLength(16)]
    public string Status { get; set; } = string.Empty;
}

public sealed class ProductInquiryDto
{
    public string Code { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string? PrimaryImageUrl { get; set; }
    public string FarmCode { get; set; } = string.Empty;
    public string FarmName { get; set; } = string.Empty;
    public string SaleUnit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal EstimatedTotal { get; set; }
    public string Status { get; set; } = string.Empty;
    public string BuyerCode { get; set; } = string.Empty;
    public string BuyerName { get; set; } = string.Empty;
    public string SellerCode { get; set; } = string.Empty;
    public string SellerName { get; set; } = string.Empty;
    public string? Message { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? RespondedAt { get; set; }
}
