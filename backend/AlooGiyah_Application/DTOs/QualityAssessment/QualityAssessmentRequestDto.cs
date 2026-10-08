using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.QualityAssessment;
// ثبت درخواست خریدار، بدون دریافت نتیجه کارشناسی از خریدار.
public class QualityAssessmentRequestDto
{
    [Required] public string AgriculturalProductCode { get; set; } = string.Empty;
    [Range(0.01, 100000000)] public decimal Quantity { get; set; }
    [Required, MaxLength(700)] public string RequestDescription { get; set; } = string.Empty;
}
