namespace AlooGiyah_Application.DTOs.QualityAssessment;

public class QualityAssessmentDto
{
    public string Code { get; set; } = string.Empty;
    public string AgriculturalProductCode { get; set; } = string.Empty;
    public string? ExpertCode { get; set; } = string.Empty;
    public string QualityDescription { get; set; } = string.Empty;
    public string QualityGrade { get; set; } = string.Empty;
    public decimal? SuggestedPrice { get; set; }
    public DateTimeOffset? AssessmentDate { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}
