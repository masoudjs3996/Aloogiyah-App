using System.ComponentModel.DataAnnotations;
namespace AlooGiyah_Application.DTOs.QualityAssessment;
public class QualityAssessmentQuoteInput
{
    [Required] public string AgriculturalProductCode { get; set; } = string.Empty;
    public string? DiscountCode { get; set; }
}
public class QualityAssessmentQuoteDto
{
    public decimal Fee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PayableAmount { get; set; }
    public decimal AvailableBalance { get; set; }
}
public class QualityAssessmentTariffInput
{
    [Range(1, 1000000000)] public decimal Fee { get; set; }
}
