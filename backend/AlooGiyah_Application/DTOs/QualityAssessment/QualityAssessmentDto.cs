namespace AlooGiyah_Application.DTOs.QualityAssessment;

public class QualityAssessmentDto
{
    public string? AgriculturalOrderCode { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ApplicantCode { get; set; }
    public string RequestDescription { get; set; } = string.Empty;
    public decimal? RequestedQuantity { get; set; }
    public decimal Fee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public QualityReportDto? Report { get; set; }
    public string? ReportFileUrl { get; set; }
    public string Code { get; set; } = string.Empty;
    public string AgriculturalProductCode { get; set; } = string.Empty;
    public string? ExpertCode { get; set; } = string.Empty;
    public string QualityDescription { get; set; } = string.Empty;
    public string QualityGrade { get; set; } = string.Empty;
    public decimal? SuggestedPrice { get; set; }
    public DateTimeOffset? AssessmentDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
