using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.QualityAssessment;
// ثبت درخواست خریدار، بدون دریافت نتیجه کارشناسی از خریدار.
public class QualityAssessmentRequestDto
{
    public string? AgriculturalOrderCode { get; set; }
    public string? DiscountCode { get; set; }
    [Required, StringLength(100, MinimumLength = 8)] public string IdempotencyKey { get; set; } = string.Empty;
    public decimal ExpectedAmount { get; set; }
    [Required] public string AgriculturalProductCode { get; set; } = string.Empty;
    [Range(0.01, 100000000)] public decimal Quantity { get; set; }
    [Required, MaxLength(700)] public string RequestDescription { get; set; } = string.Empty;
}
