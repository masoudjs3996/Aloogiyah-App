using AlooGiyah_Domain.Entities.Store;
using AlooGiyah_Domain.Entities.UserFolder;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AlooGiyah_Domain.Entities;

public class QualityAssessment : BaseEntity
{
    #region Properties
    [Key, DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int QualityAssessmentId { get; set; }
    [Required]
    public int AgriculturalProductId { get; set; }

    public int? ExpertId { get; set; }

    [Required]
    public int ApplicantId { get; set; }

    [Required]
    [MaxLength(1000)]
    public string QualityDescription { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string QualityGrade { get; set; } = string.Empty;

    public decimal? SuggestedPrice { get; set; }

    public DateTimeOffset? AssessmentDate { get; set; }
    #endregion

    #region Relations
    [ForeignKey(nameof(AgriculturalProductId))]
    public AgriculturalProduct AgriculturalProduct { get; set; } = null!;

    [ForeignKey(nameof(ExpertId))]
    public User? Expert { get; set; } = null!;

    [ForeignKey(nameof(ApplicantId))]
    public User Applicant { get; set; } = null!;
    #endregion
}