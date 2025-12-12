using AlooGiyah_Application.DTOs.BaseDto;

namespace AlooGiyah_Application.DTOs.QualityAssessment;

public class QualityAssessmentFilterDto : BaseFilterDto
{
    public string? AgriculturalProductCode { get; set; }
    public string? ExpertCode { get; set; }
    public string? QualityGrade { get; set; }
    public decimal? MinSuggestedPrice { get; set; }
    public decimal? MaxSuggestedPrice { get; set; }
    public DateTimeOffset? StartAssessmentDate { get; set; }
    public DateTimeOffset? EndAssessmentDate { get; set; }
}