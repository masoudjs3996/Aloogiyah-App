using System.ComponentModel.DataAnnotations;

namespace AlooGiyah_Application.DTOs.QualityAssessment;

public class QualityAssessmentCreateDto
{
    [Required]
    public string AgriculturalProductCode { get; set; } = string.Empty;

    [Required]
    public string ExpertCode { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string QualityDescription { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string QualityGrade { get; set; } = string.Empty;

    public decimal? SuggestedPrice { get; set; }

    public DateTimeOffset? AssessmentDate { get; set; }
}
